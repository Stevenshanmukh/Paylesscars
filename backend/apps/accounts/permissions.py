"""
Custom permissions for CarNegotiate.
"""
from rest_framework import permissions


class IsVerifiedDealer(permissions.BasePermission):
    """
    Permission that only allows verified dealers to access the view.
    """
    message = 'Your dealer account must be verified to perform this action.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not request.user.is_dealer:
            return False
        # Check if dealer profile exists and is verified
        if hasattr(request.user, 'dealer_profile'):
            return request.user.dealer_profile.is_verified
        return False


class IsBuyer(permissions.BasePermission):
    """
    Permission that only allows buyers to access the view.
    """
    message = 'Only buyers can perform this action.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_buyer


class IsDealer(permissions.BasePermission):
    """
    Permission that only allows dealers to access the view.
    """
    message = 'Only dealers can perform this action.'
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_dealer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission that only allows owners of an object to edit it.
    Assumes the model instance has a `user` attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'buyer'):
            return obj.buyer == request.user
        return False


class IsNegotiationParticipant(permissions.BasePermission):
    """
    Permission that only allows participants of a negotiation to access it.
    """
    message = 'You are not a participant in this negotiation.'
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Check if user is the buyer
        if hasattr(obj, 'buyer') and obj.buyer == request.user:
            return True
        
        # Check if user is the dealer (via vehicle)
        if hasattr(obj, 'vehicle') and hasattr(obj.vehicle, 'dealer'):
            if obj.vehicle.dealer.user == request.user:
                return True
        
        return False


class IsVehicleOwner(permissions.BasePermission):
    """
    Permission that only allows the vehicle owner (dealer) to modify it.
    """
    message = 'You can only modify your own vehicles.'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        if hasattr(obj, 'dealer'):
            return obj.dealer.user == request.user
        
        return False
