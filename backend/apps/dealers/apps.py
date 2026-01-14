from django.apps import AppConfig


class DealersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dealers'
    verbose_name = 'Dealer Management'

    def ready(self):
        try:
            import apps.dealers.signals  # noqa: F401
        except ImportError:
            pass
