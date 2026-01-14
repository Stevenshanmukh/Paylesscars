"""
Custom User models for CarNegotiate.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from core.models import TimeStampedModel


class CustomUserManager(BaseUserManager):
    """
    Custom user manager for email-based authentication.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('user_type', CustomUser.UserType.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model that uses email for authentication.
    Supports buyer, dealer, and admin user types.
    """
    
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="custom_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="custom_user_set",
        related_query_name="user",
    )
    
    class UserType(models.TextChoices):
        BUYER = 'buyer', 'Buyer'
        DEALER = 'dealer', 'Dealer'
        ADMIN = 'admin', 'Admin'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.BUYER
    )
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['user_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def is_buyer(self):
        return self.user_type == self.UserType.BUYER
    
    @property
    def is_dealer(self):
        return self.user_type == self.UserType.DEALER
    
    @property
    def is_admin(self):
        return self.user_type == self.UserType.ADMIN
    
    def get_full_name(self):
        """Return the full name from profile or empty string."""
        if hasattr(self, 'profile'):
            return self.profile.full_name
        return ""
    
    def get_short_name(self):
        """Return the short name for the user."""
        if hasattr(self, 'profile'):
            return self.profile.first_name
        return self.email.split('@')[0]


class UserProfile(TimeStampedModel):
    """
    Extended profile information for users.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Location fields
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    
    class Meta:
        verbose_name = 'user profile'
        verbose_name_plural = 'user profiles'
    
    def __str__(self):
        return f"Profile for {self.user.email}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.user.email
    
    @property
    def location_display(self):
        if self.city and self.state:
            return f"{self.city}, {self.state}"
        return self.city or self.state or ""
