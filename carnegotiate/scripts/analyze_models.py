import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps
from django.db import models
import json

def get_field_info(field):
    """Extract detailed field information"""
    info = {
        'name': field.name,
        'type': field.get_internal_type(),
        'null': field.null,
        'blank': field.blank,
        'default': str(field.default) if field.default != models.NOT_PROVIDED else None,
        'unique': field.unique,
        'primary_key': field.primary_key,
        'db_index': field.db_index,
    }
    
    # Add max_length for char fields
    if hasattr(field, 'max_length') and field.max_length:
        info['max_length'] = field.max_length
    
    # Add choices if available
    if field.choices:
        info['choices'] = [c[0] for c in field.choices]
    
    # Add related model for ForeignKey/ManyToMany
    if hasattr(field, 'related_model') and field.related_model:
        info['related_model'] = field.related_model.__name__
        info['related_name'] = field.remote_field.related_name if field.remote_field else None
        info['on_delete'] = str(field.remote_field.on_delete.__name__) if hasattr(field.remote_field, 'on_delete') else None
    
    # Add decimal places for decimal fields
    if hasattr(field, 'decimal_places'):
        info['decimal_places'] = field.decimal_places
        info['max_digits'] = field.max_digits
    
    return info

def analyze_models():
    """Analyze all Django models"""
    result = {}
    
    # Get all apps and filter
    for app_config in apps.get_app_configs():
        app_label = app_config.label
        # Skip django and standard third party apps
        if app_label.startswith('django') or app_label in ['admin', 'auth', 'contenttypes', 'sessions', 'messages', 'staticfiles']:
            continue
            
        try:
            result[app_label] = {}
            models_list = list(app_config.get_models())
            if not models_list:
                continue

            for model in models_list:
                model_info = {
                    'table_name': model._meta.db_table,
                    'verbose_name': str(model._meta.verbose_name),
                    'fields': [],
                    'meta': {
                        'ordering': list(model._meta.ordering) if model._meta.ordering else None,
                        'indexes': [],
                        'unique_together': list(model._meta.unique_together) if model._meta.unique_together else None,
                    }
                }
                
                # Get all fields
                for field in model._meta.get_fields():
                    if hasattr(field, 'get_internal_type'):
                        model_info['fields'].append(get_field_info(field))
                
                # Get indexes
                for index in model._meta.indexes:
                    model_info['meta']['indexes'].append({
                        'name': index.name,
                        'fields': list(index.fields),
                    })
                
                result[app_label][model.__name__] = model_info
                
        except LookupError:
            print(f"App '{app_label}' not found")
    
    return result

# Run analysis
data = analyze_models()

# Pretty print
for app_name, models in data.items():
    print(f"\n{'='*60}")
    print(f"APP: {app_name.upper()}")
    print('='*60)
    
    for model_name, info in models.items():
        print(f"\n  TABLE: {info['table_name']}")
        print(f"  Model: {model_name}")
        print(f"  {'-'*40}")
        
        for field in info['fields']:
            nullable = "NULL" if field['null'] else "NOT NULL"
            indexed = "INDEXED" if field.get('db_index') else ""
            pk = "PRIMARY KEY" if field.get('primary_key') else ""
            unique = "UNIQUE" if field.get('unique') else ""
            
            extras = ' '.join(filter(None, [nullable, indexed, pk, unique]))
            
            if 'related_model' in field:
                print(f"    {field['name']}: {field['type']} -> {field['related_model']} ({extras})")
            else:
                print(f"    {field['name']}: {field['type']} ({extras})")
