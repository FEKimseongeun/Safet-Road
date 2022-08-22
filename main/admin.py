from .models import Cctv,Lamp,Loadpoint,Securitycenter
from .models import Cctv,Lamp,Loadpoint,Securitycenter,PoliceStation
from django.contrib import admin

# Register your models here.
admin.site.register(Cctv)
# admin.site.register(Alltimeshop)
admin.site.register(Lamp)
admin.site.register(Loadpoint)
admin.site.register(Securitycenter)

# 현지 경찰서
admin.site.register(PoliceStation)