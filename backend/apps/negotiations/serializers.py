"""
Negotiation Serializers for CarNegotiate API.
"""
from decimal import Decimal
from rest_framework import serializers
from apps.vehicles.models import Vehicle
from .models import Negotiation, Offer


class OfferSerializer(serializers.ModelSerializer):
    """Serializer for individual offers."""
    offered_by_display = serializers.CharField(
        source='get_offered_by_display',
        read_only=True
    )
    
    class Meta:
        model = Offer
        fields = [
            'id', 'amount', 'offered_by', 'offered_by_display',
            'message', 'status', 'created_at', 'responded_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'responded_at']


class VehicleMiniSerializer(serializers.Serializer):
    """Minimal vehicle info for negotiation lists."""
    id = serializers.UUIDField()
    title = serializers.SerializerMethodField()
    make = serializers.CharField()
    model = serializers.CharField()
    year = serializers.IntegerField()
    asking_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    primary_image = serializers.SerializerMethodField()
    
    def get_title(self, obj):
        return f"{obj.year} {obj.make} {obj.model}"
    
    def get_primary_image(self, obj):
        # Use .all() to leverage prefetch_related cache if available
        # Note: VehicleMiniSerializer is often used in Negotiation list where vehicle images might NOT be prefetched
        # But if they are (as in optimized views), this avoids N+1.
        # If not, .all() fetches them, which is same cost as .filter().first() roughly.
        if hasattr(obj, 'images'):
             images = list(obj.images.all())
             if not images:
                 return None
             primary = next((img for img in images if img.is_primary), images[0])
             return primary.image.url if primary.image else None
        return None


class NegotiationListSerializer(serializers.ModelSerializer):
    """Serializer for listing negotiations."""
    vehicle = VehicleMiniSerializer(read_only=True)
    current_offer = serializers.SerializerMethodField()
    other_party_name = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()
    is_my_turn = serializers.SerializerMethodField()
    
    class Meta:
        model = Negotiation
        fields = [
            'id', 'vehicle', 'status', 'current_offer',
            'other_party_name', 'my_role', 'is_my_turn',
            'expires_at', 'created_at', 'updated_at', 'accepted_price'
        ]
    
    def get_current_offer(self, obj):
        # Use .all() to leverage prefetch_related('offers')
        offers = obj.offers.all()
        # Find pending offer (latest)
        pending = next((o for o in offers if o.status == Offer.Status.PENDING), None)
        
        if pending:
            return {
                'amount': str(pending.amount),
                'offered_by': pending.offered_by,
                'message': pending.message[:100] if pending.message else None,
                'created_at': pending.created_at.isoformat()
            }
        return None
    
    def get_other_party_name(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return None
        
        if user == obj.buyer:
            # User is buyer, show dealer name
            return obj.vehicle.dealer.business_name
        else:
            # User is dealer, show buyer name
            return obj.buyer.get_full_name() or obj.buyer.email
    
    def get_my_role(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return None
        
        if user == obj.buyer:
            return 'buyer'
        elif hasattr(obj.vehicle, 'dealer') and user == obj.vehicle.dealer.user:
            return 'dealer'
        return None
    
    def get_is_my_turn(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or obj.status != Negotiation.Status.ACTIVE:
            return False
        
        # Use .all() to leverage prefetch_related('offers')
        offers = obj.offers.all()
        pending = next((o for o in offers if o.status == Offer.Status.PENDING), None)
        
        if not pending:
            return False
        
        is_buyer = user == obj.buyer
        is_dealer = hasattr(obj.vehicle, 'dealer') and user == obj.vehicle.dealer.user
        
        # If last offer was from buyer, it's dealer's turn
        if pending.offered_by == 'buyer' and is_dealer:
            return True
        # If last offer was from dealer, it's buyer's turn
        if pending.offered_by == 'dealer' and is_buyer:
            return True
        
        return False


class NegotiationDetailSerializer(serializers.ModelSerializer):
    """Full serializer for negotiation detail view."""
    vehicle = VehicleMiniSerializer(read_only=True)
    offers = OfferSerializer(many=True, read_only=True)
    can_accept = serializers.SerializerMethodField()
    can_counter = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_reject = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()
    other_party = serializers.SerializerMethodField()
    
    class Meta:
        model = Negotiation
        fields = [
            'id', 'vehicle', 'status', 'offers', 'expires_at',
            'accepted_price', 'created_at', 'updated_at',
            'can_accept', 'can_counter', 'can_cancel', 'can_reject',
            'my_role', 'other_party'
        ]
    
    def get_can_accept(self, obj):
        from .state_machine import NegotiationStateMachine
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        actions = NegotiationStateMachine.get_available_actions(obj, user)
        return 'accept' in actions
    
    def get_can_counter(self, obj):
        from .state_machine import NegotiationStateMachine
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        actions = NegotiationStateMachine.get_available_actions(obj, user)
        return 'counter_offer' in actions
    
    def get_can_cancel(self, obj):
        from .state_machine import NegotiationStateMachine
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        actions = NegotiationStateMachine.get_available_actions(obj, user)
        return 'cancel' in actions
    
    def get_can_reject(self, obj):
        from .state_machine import NegotiationStateMachine
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        actions = NegotiationStateMachine.get_available_actions(obj, user)
        return 'reject' in actions
    
    def get_my_role(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return None
        if user == obj.buyer:
            return 'buyer'
        elif hasattr(obj.vehicle, 'dealer') and user == obj.vehicle.dealer.user:
            return 'dealer'
        return None
    
    def get_other_party(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return None
        
        if user == obj.buyer:
            # Show dealer info
            dealer = obj.vehicle.dealer
            return {
                'name': dealer.business_name,
                'type': 'dealer',
                'city': dealer.city,
                'state': dealer.state,
                'is_verified': dealer.verification_status == 'verified'
            }
        else:
            # Show buyer info
            return {
                'name': obj.buyer.get_full_name() or 'Buyer',
                'type': 'buyer',
                'email': obj.buyer.email
            }


class CreateNegotiationSerializer(serializers.Serializer):
    """Serializer for starting a new negotiation."""
    vehicle_id = serializers.UUIDField()
    initial_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_vehicle_id(self, value):
        """Validate vehicle exists and is available."""
        try:
            vehicle = Vehicle.objects.get(pk=value)
            if vehicle.status != Vehicle.Status.ACTIVE:
                raise serializers.ValidationError(
                    "This vehicle is not available for negotiation"
                )
            return value
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError("Vehicle not found")
    
    def validate_initial_amount(self, value):
        """Validate amount is positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value
    
    def validate(self, data):
        """Cross-field validation for offer amount."""
        vehicle_id = data.get('vehicle_id')
        amount = data.get('initial_amount')
        
        if vehicle_id and amount:
            try:
                vehicle = Vehicle.objects.get(pk=vehicle_id)
                min_offer = vehicle.asking_price * Decimal('0.5')
                if amount < min_offer:
                    raise serializers.ValidationError({
                        'initial_amount': f"Offer must be at least ${min_offer:,.2f} (50% of asking price)"
                    })
            except Vehicle.DoesNotExist:
                pass  # Already handled in field validation
        
        return data


class SubmitOfferSerializer(serializers.Serializer):
    """Serializer for submitting counter-offers."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_amount(self, value):
        """Validate amount is positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value


class AcceptOfferSerializer(serializers.Serializer):
    """Serializer for accepting offers (confirmation)."""
    confirm = serializers.BooleanField(required=True)
    
    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm the acceptance")
        return value


class RejectNegotiationSerializer(serializers.Serializer):
    """Serializer for rejecting negotiations."""
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
