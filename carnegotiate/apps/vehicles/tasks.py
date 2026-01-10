"""
Celery tasks for vehicles app.
Image processing and optimization.
"""
from celery import shared_task
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os


@shared_task
def process_vehicle_image(image_id: str):
    """
    Process a vehicle image:
    - Resize to optimal dimensions
    - Create thumbnail
    - Optimize for web
    """
    from .models import VehicleImage
    
    try:
        vehicle_image = VehicleImage.objects.get(pk=image_id)
    except VehicleImage.DoesNotExist:
        return
    
    if not vehicle_image.image:
        return
    
    try:
        # Open image
        img = Image.open(vehicle_image.image)
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize main image (max 1920x1080)
        max_size = (1920, 1080)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save optimized main image
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        # Replace original with optimized version
        filename = os.path.basename(vehicle_image.image.name)
        vehicle_image.image.save(
            filename,
            ContentFile(buffer.read()),
            save=False
        )
        
        # Create thumbnail (400x300)
        thumb_size = (400, 300)
        img.thumbnail(thumb_size, Image.Resampling.LANCZOS)
        
        thumb_buffer = BytesIO()
        img.save(thumb_buffer, format='JPEG', quality=80, optimize=True)
        thumb_buffer.seek(0)
        
        # Save thumbnail
        thumb_filename = f"thumb_{filename}"
        vehicle_image.thumbnail.save(
            thumb_filename,
            ContentFile(thumb_buffer.read()),
            save=False
        )
        
        vehicle_image.is_processed = True
        vehicle_image.save()
        
    except Exception as e:
        print(f"Error processing image {image_id}: {e}")


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
        return
    
    unprocessed = VehicleImage.objects.filter(
        vehicle__dealer=dealer,
        is_processed=False
    )
    
    for image in unprocessed:
        process_vehicle_image.delay(str(image.id))


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
        # Delete the actual file
        if image.image:
            image.image.delete(save=False)
        if image.thumbnail:
            image.thumbnail.delete(save=False)
        image.delete()
        count += 1
    
    return count


@shared_task
def generate_vehicle_report(dealer_id: str):
    """
    Generate inventory report for dealer.
    """
    from apps.dealers.models import Dealer
    from .models import Vehicle
    from django.db.models import Avg, Count, Sum
    
    try:
        dealer = Dealer.objects.get(pk=dealer_id)
    except Dealer.DoesNotExist:
        return
    
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
        return
    
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


# Import timezone at the end to avoid issues
from django.utils import timezone
