"""
Celery tasks for vehicles app.
Image processing and optimization.
"""
from celery import shared_task
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os


# Image size configurations
IMAGE_SIZES = {
    'thumbnail': (400, 300),    # For listings/cards
    'medium': (800, 600),       # For detail views
    'large': (1920, 1080),      # For galleries/zoom
}


@shared_task
def process_vehicle_image(image_id: str):
    """
    Process a vehicle image:
    - Resize to optimal dimensions
    - Create thumbnail, medium, and large variants
    - Optimize for web (JPEG quality 85)
    """
    from .models import VehicleImage
    
    try:
        vehicle_image = VehicleImage.objects.get(pk=image_id)
    except VehicleImage.DoesNotExist:
        return f"Image {image_id} not found"
    
    if not vehicle_image.image:
        return f"Image {image_id} has no file"
    
    if vehicle_image.is_processed:
        return f"Image {image_id} already processed"
    
    try:
        # Open original image
        img = Image.open(vehicle_image.image)
        
        # Convert to RGB if necessary (for PNG with transparency, etc.)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        original_filename = os.path.basename(vehicle_image.image.name)
        name_without_ext = os.path.splitext(original_filename)[0]
        
        # Generate large variant (main display image)
        large_img = img.copy()
        large_img.thumbnail(IMAGE_SIZES['large'], Image.Resampling.LANCZOS)
        large_buffer = BytesIO()
        large_img.save(large_buffer, format='JPEG', quality=85, optimize=True)
        large_buffer.seek(0)
        vehicle_image.large.save(
            f"{name_without_ext}_large.jpg",
            ContentFile(large_buffer.read()),
            save=False
        )
        
        # Generate medium variant
        medium_img = img.copy()
        medium_img.thumbnail(IMAGE_SIZES['medium'], Image.Resampling.LANCZOS)
        medium_buffer = BytesIO()
        medium_img.save(medium_buffer, format='JPEG', quality=85, optimize=True)
        medium_buffer.seek(0)
        vehicle_image.medium.save(
            f"{name_without_ext}_medium.jpg",
            ContentFile(medium_buffer.read()),
            save=False
        )
        
        # Generate thumbnail
        thumb_img = img.copy()
        thumb_img.thumbnail(IMAGE_SIZES['thumbnail'], Image.Resampling.LANCZOS)
        thumb_buffer = BytesIO()
        thumb_img.save(thumb_buffer, format='JPEG', quality=80, optimize=True)
        thumb_buffer.seek(0)
        vehicle_image.thumbnail.save(
            f"{name_without_ext}_thumb.jpg",
            ContentFile(thumb_buffer.read()),
            save=False
        )
        
        # Mark as processed
        vehicle_image.is_processed = True
        vehicle_image.save()
        
        return f"Successfully processed image {image_id}"
        
    except Exception as e:
        print(f"Error processing image {image_id}: {e}")
        return f"Error: {e}"


@shared_task
def bulk_process_dealer_images(dealer_id: str):
    """
    Process all unprocessed images for a dealer.
    """
    from .models import VehicleImage
    from apps.dealers.models import Dealer
    
    try:
        dealer = Dealer.objects.get(pk=dealer_id)
    except Dealer.DoesNotExist:
        return f"Dealer {dealer_id} not found"
    
    unprocessed = VehicleImage.objects.filter(
        vehicle__dealer=dealer,
        is_processed=False
    )
    
    count = 0
    for image in unprocessed:
        process_vehicle_image.delay(str(image.id))
        count += 1
    
    return f"Queued {count} images for processing"


@shared_task
def cleanup_orphaned_images():
    """
    Clean up images that are no longer associated with vehicles.
    Run daily via Celery Beat.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import VehicleImage
    
    # Find images with no vehicle (orphaned)
    cutoff = timezone.now() - timedelta(days=1)
    
    orphaned = VehicleImage.objects.filter(
        vehicle__isnull=True,
        created_at__lt=cutoff
    )
    
    count = 0
    for image in orphaned:
        # Delete all image files
        for field_name in ['image', 'thumbnail', 'medium', 'large']:
            field = getattr(image, field_name)
            if field:
                field.delete(save=False)
        image.delete()
        count += 1
    
    return f"Cleaned up {count} orphaned images"


@shared_task
def generate_vehicle_report(dealer_id: str):
    """
    Generate inventory report for dealer.
    """
    from apps.dealers.models import Dealer
    from .models import Vehicle
    from django.db.models import Avg, Count, Sum
    from django.utils import timezone
    
    try:
        dealer = Dealer.objects.get(pk=dealer_id)
    except Dealer.DoesNotExist:
        return None
    
    vehicles = Vehicle.objects.filter(dealer=dealer)
    
    report = {
        'dealer_name': dealer.business_name,
        'generated_at': timezone.now().isoformat(),
        'summary': {
            'total_vehicles': vehicles.count(),
            'active': vehicles.filter(status=Vehicle.Status.ACTIVE).count(),
            'sold': vehicles.filter(status=Vehicle.Status.SOLD).count(),
            'draft': vehicles.filter(status=Vehicle.Status.DRAFT).count(),
        },
        'inventory_value': vehicles.filter(
            status=Vehicle.Status.ACTIVE
        ).aggregate(
            total=Sum('asking_price'),
            average=Avg('asking_price')
        ),
        'by_make': list(
            vehicles.values('make').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
        ),
        'by_body_type': list(
            vehicles.values('body_type').annotate(
                count=Count('id')
            ).order_by('-count')
        ),
    }
    
    return report


@shared_task
def decode_vin_async(vehicle_id: str):
    """
    Decode VIN asynchronously and update vehicle.
    """
    from .models import Vehicle
    from .services import VehicleService
    
    try:
        vehicle = Vehicle.objects.get(pk=vehicle_id)
    except Vehicle.DoesNotExist:
        return None
    
    decoded = VehicleService.decode_vin(vehicle.vin)
    
    if 'error' not in decoded:
        # Update vehicle with decoded info (only empty fields)
        update_fields = []
        
        if not vehicle.make and decoded.get('make'):
            vehicle.make = decoded['make']
            update_fields.append('make')
        
        if not vehicle.model and decoded.get('model'):
            vehicle.model = decoded['model']
            update_fields.append('model')
        
        if not vehicle.year and decoded.get('year'):
            vehicle.year = int(decoded['year'])
            update_fields.append('year')
        
        if not vehicle.body_type and decoded.get('body_type'):
            vehicle.body_type = decoded['body_type']
            update_fields.append('body_type')
        
        if not vehicle.transmission and decoded.get('transmission'):
            vehicle.transmission = decoded['transmission']
            update_fields.append('transmission')
        
        if update_fields:
            vehicle.save(update_fields=update_fields)
    
    return decoded
