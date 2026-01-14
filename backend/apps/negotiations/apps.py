from django.apps import AppConfig


class NegotiationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.negotiations'
    verbose_name = 'Price Negotiations'

    def ready(self):
        try:
            import apps.negotiations.signals  # noqa: F401
        except ImportError:
            pass
