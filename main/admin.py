from .models import Cctv,Loadpoint,Lamp,Securitycenter,PoliceStation
from django.contrib import admin

# Register your models here.
admin.site.register(Cctv)
admin.site.register(PoliceStation)
# admin.site.register(Alltimeshop)
admin.site.register(Lamp)
admin.site.register(Loadpoint)
admin.site.register(Securitycenter)