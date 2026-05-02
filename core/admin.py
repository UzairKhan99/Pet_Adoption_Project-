from django.contrib import admin
#My Imports
from .models import Pet, Shelter, Donation, CustomUser, Adoption, VetAppointment, Veterinarian, MedicalRecord
from core.models import CustomUser

# Register your models here.

# ------------------------
# User
# ------------------------
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
# admin.site.register(CustomUser, CustomUserAdmin)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )

# admin.site.register(CustomUser, CustomUserAdmin)




# ------------------------
# Shelter
# ------------------------
@admin.register(Shelter)
class ShelterAdmin(admin.ModelAdmin):
    list_display = ('id', 'Name', 'Location', 'Contact', 'CreatedAt')
    search_fields = ('Name', 'Location')
    list_filter = ('Location',)


# ------------------------
# Pet
# ------------------------
@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('id', 'Name', 'Species', 'Breed', 'Age', 'Gender', 'Status', 'Shelter', 'CreatedAt')
    search_fields = ('Name', 'Breed')
    list_filter = ('Species', 'Status', 'Gender', 'Shelter')


# ------------------------
# Adoption
# ------------------------
@admin.register(Adoption)
class AdoptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'Pet', 'Adopter', 'AdoptionDate', 'Status')
    list_filter = ('Status',)
    search_fields = ('Pet__Name', 'Adopter__username')


# ------------------------
# Veterinarian
# ------------------------
@admin.register(Veterinarian)
class VeterinarianAdmin(admin.ModelAdmin):
    list_display = ('id', 'Name', 'Specialization', 'Contact')
    search_fields = ('Name', 'Specialization')


# ------------------------
# VetAppointment
# ------------------------
@admin.register(VetAppointment)
class VetAppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'Pet', 'Vet', 'AppointmentDate', 'Reason', 'Notes')
    search_fields = ('Pet__Name', 'Vet__Name', 'Reason')
    list_filter = ('AppointmentDate', 'Vet')


# ------------------------
# MedicalRecord
# ------------------------
@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'Pet', 'Vaccine', 'Treatment', 'RecordDate')
    search_fields = ('Pet__Name', 'Vaccine', 'Treatment')
    list_filter = ('RecordDate',)


# ------------------------
# Donation
# ------------------------
@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('id', 'Shelter', 'User', 'Amount', 'DonationDate')
    search_fields = ('User__username', 'Shelter__Name')
    list_filter = ('Shelter', 'DonationDate')
