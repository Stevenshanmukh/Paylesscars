"""
Analytics Service Layer for CarNegotiate.
Handles dealer and platform analytics.
"""
from typing import Dict, List
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Sum, F, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth


class AnalyticsService:
    """
    Service class for analytics and reporting.
    """
    
    # -------------------------------------------------------------------------
    # Dealer Analytics
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_dealer_overview(cls, dealer, days: int = 30) -> Dict:
        """
        Get dealer performance overview.
        """
        from apps.vehicles.models import Vehicle
        from apps.negotiations.models import Negotiation
        
        now = timezone.now()
        start_date = now - timedelta(days=days)
        
        vehicles = Vehicle.objects.filter(dealer=dealer)
        negotiations = Negotiation.objects.filter(
            vehicle__dealer=dealer,
            created_at__gte=start_date
        )
        
        # Calculate metrics
        overview = {
            'period_days': days,
            
            # Inventory metrics
            'inventory': {
                'total': vehicles.count(),
                'active': vehicles.filter(status='active').count(),
                'pending_sale': vehicles.filter(status='pending_sale').count(),
                'sold': vehicles.filter(status='sold', sold_at__gte=start_date).count(),
                'total_value': float(vehicles.filter(
                    status='active'
                ).aggregate(Sum('asking_price'))['asking_price__sum'] or 0),
            },
            
            # Negotiation metrics
            'negotiations': {
                'total': negotiations.count(),
                'active': negotiations.filter(status='active').count(),
                'accepted': negotiations.filter(status='accepted').count(),
                'rejected': negotiations.filter(status='rejected').count(),
                'expired': negotiations.filter(status='expired').count(),
                'cancelled': negotiations.filter(status='cancelled').count(),
            },
            
            # Revenue metrics
            'revenue': cls._calculate_revenue_metrics(dealer, start_date),
            
            # Performance metrics
            'performance': cls._calculate_performance_metrics(dealer, start_date),
        }
        
        return overview
    
    @classmethod
    def _calculate_revenue_metrics(cls, dealer, start_date) -> Dict:
        """Calculate revenue metrics."""
        from apps.negotiations.models import Negotiation
        
        accepted = Negotiation.objects.filter(
            vehicle__dealer=dealer,
            status='accepted',
            updated_at__gte=start_date
        )
        
        total_revenue = sum(n.accepted_price or 0 for n in accepted)
        deal_count = accepted.count()
        
        return {
            'total': float(total_revenue),
            'deal_count': deal_count,
            'average_deal': float(total_revenue / deal_count) if deal_count > 0 else 0,
        }
    
    @classmethod
    def _calculate_performance_metrics(cls, dealer, start_date) -> Dict:
        """Calculate performance metrics."""
        from apps.negotiations.models import Negotiation, Offer
        
        negotiations = Negotiation.objects.filter(
            vehicle__dealer=dealer,
            created_at__gte=start_date
        )
        
        total = negotiations.count()
        accepted = negotiations.filter(status='accepted').count()
        
        # Calculate average response time
        dealer_responses = Offer.objects.filter(
            negotiation__vehicle__dealer=dealer,
            offered_by='dealer',
            created_at__gte=start_date
        )
        
        response_times = []
        for offer in dealer_responses[:50]:  # Sample
            prev_offer = Offer.objects.filter(
                negotiation=offer.negotiation,
                offered_by='buyer',
                created_at__lt=offer.created_at
            ).order_by('-created_at').first()
            
            if prev_offer:
                delta = (offer.created_at - prev_offer.created_at).total_seconds() / 3600
                response_times.append(delta)
        
        avg_response = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            'conversion_rate': round((accepted / total * 100) if total > 0 else 0, 1),
            'avg_response_hours': round(avg_response, 1),
            'offers_per_vehicle': round(
                Offer.objects.filter(
                    negotiation__vehicle__dealer=dealer,
                    created_at__gte=start_date
                ).count() / max(negotiations.values('vehicle').distinct().count(), 1),
                1
            ),
        }
    
    @classmethod
    def get_dealer_trends(cls, dealer, days: int = 30, granularity: str = 'day') -> List[Dict]:
        """
        Get dealer trends over time.
        
        Args:
            dealer: Dealer to analyze
            days: Number of days to analyze
            granularity: 'day', 'week', or 'month'
        """
        from apps.negotiations.models import Negotiation
        
        now = timezone.now()
        start_date = now - timedelta(days=days)
        
        truncator = {
            'day': TruncDate,
            'week': TruncWeek,
            'month': TruncMonth
        }.get(granularity, TruncDate)
        
        trends = Negotiation.objects.filter(
            vehicle__dealer=dealer,
            created_at__gte=start_date
        ).annotate(
            period=truncator('created_at')
        ).values('period').annotate(
            negotiations=Count('id'),
            accepted=Count('id', filter=Q(status='accepted')),
            revenue=Sum('accepted_price', filter=Q(status='accepted'))
        ).order_by('period')
        
        return list(trends)
    
    @classmethod
    def get_vehicle_performance(cls, dealer, limit: int = 10) -> List[Dict]:
        """
        Get top performing vehicles by engagement.
        """
        from apps.vehicles.models import Vehicle
        
        vehicles = Vehicle.objects.filter(
            dealer=dealer,
            status='active'
        ).annotate(
            negotiation_count=Count('negotiations'),
            view_count_val=F('view_count')
        ).order_by('-negotiation_count', '-view_count_val')[:limit]
        
        return [
            {
                'id': str(v.id),
                'title': f"{v.year} {v.make} {v.model}",
                'asking_price': float(v.asking_price),
                'views': v.view_count or 0,
                'negotiations': v.negotiation_count,
                'engagement_rate': round(
                    (v.negotiation_count / max(v.view_count or 1, 1)) * 100, 1
                )
            }
            for v in vehicles
        ]
    
    # -------------------------------------------------------------------------
    # Platform Analytics (Admin)
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_platform_overview(cls, days: int = 30) -> Dict:
        """
        Get platform-wide analytics (admin only).
        """
        from apps.accounts.models import User
        from apps.dealers.models import Dealer
        from apps.vehicles.models import Vehicle
        from apps.negotiations.models import Negotiation
        
        now = timezone.now()
        start_date = now - timedelta(days=days)
        
        return {
            'period_days': days,
            
            'users': {
                'total': User.objects.count(),
                'new': User.objects.filter(date_joined__gte=start_date).count(),
                'buyers': User.objects.filter(user_type='buyer').count(),
                'dealers': User.objects.filter(user_type='dealer').count(),
            },
            
            'dealers': {
                'total': Dealer.objects.count(),
                'verified': Dealer.objects.filter(verification_status='verified').count(),
                'pending': Dealer.objects.filter(verification_status='pending').count(),
            },
            
            'vehicles': {
                'total': Vehicle.objects.count(),
                'active': Vehicle.objects.filter(status='active').count(),
                'sold': Vehicle.objects.filter(
                    status='sold',
                    sold_at__gte=start_date
                ).count(),
            },
            
            'negotiations': {
                'total': Negotiation.objects.filter(created_at__gte=start_date).count(),
                'active': Negotiation.objects.filter(status='active').count(),
                'completed': Negotiation.objects.filter(
                    status='accepted',
                    updated_at__gte=start_date
                ).count(),
            },
            
            'revenue': {
                'total_gmv': float(Negotiation.objects.filter(
                    status='accepted',
                    updated_at__gte=start_date
                ).aggregate(Sum('accepted_price'))['accepted_price__sum'] or 0),
            }
        }
    
    @classmethod
    def get_top_dealers(cls, days: int = 30, limit: int = 10) -> List[Dict]:
        """
        Get top performing dealers.
        """
        from apps.dealers.models import Dealer
        
        start_date = timezone.now() - timedelta(days=days)
        
        dealers = Dealer.objects.filter(
            verification_status='verified'
        ).annotate(
            deals=Count(
                'vehicles__negotiations',
                filter=Q(
                    vehicles__negotiations__status='accepted',
                    vehicles__negotiations__updated_at__gte=start_date
                )
            ),
            revenue=Sum(
                'vehicles__negotiations__accepted_price',
                filter=Q(
                    vehicles__negotiations__status='accepted',
                    vehicles__negotiations__updated_at__gte=start_date
                )
            )
        ).order_by('-deals')[:limit]
        
        return [
            {
                'id': str(d.id),
                'name': d.business_name,
                'city': d.city,
                'state': d.state,
                'deals': d.deals,
                'revenue': float(d.revenue or 0),
            }
            for d in dealers
        ]
    
    # -------------------------------------------------------------------------
    # Search Analytics
    # -------------------------------------------------------------------------
    
    @classmethod
    def get_popular_searches(cls, days: int = 7, limit: int = 10) -> List[Dict]:
        """
        Get popular search terms.
        TODO: Implement search tracking.
        """
        # Placeholder - would track actual searches
        return [
            {'term': 'Toyota Camry', 'count': 1250},
            {'term': 'Honda Accord', 'count': 980},
            {'term': 'BMW X5', 'count': 756},
            {'term': 'Ford F-150', 'count': 654},
            {'term': 'Tesla Model 3', 'count': 543},
        ][:limit]
    
    @classmethod
    def get_popular_makes(cls, days: int = 30) -> List[Dict]:
        """
        Get most popular makes by vehicle views/negotiations.
        """
        from apps.vehicles.models import Vehicle
        
        makes = Vehicle.objects.filter(
            status='active'
        ).values('make').annotate(
            count=Count('id'),
            total_views=Sum('view_count')
        ).order_by('-count')[:10]
        
        return list(makes)
