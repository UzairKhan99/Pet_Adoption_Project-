from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# ------------------------
# Custom User Model
# ------------------------
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('ADOPTER', 'Adopter'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ADOPTER')

    def __str__(self):
        return f"{self.username} ({self.role})"

    # Fix ManyToMany conflicts for AbstractUser
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='core_customuser_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='core_customuser_permissions_set',
        blank=True
    )


# ------------------------
# Shelter
# ------------------------
class Shelter(models.Model):
    Name = models.CharField(max_length=100, default="unknown")
    Location = models.CharField(max_length=150, default="unknown")
    Contact = models.CharField(max_length=50, default="unknown")
    CreatedAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.Name


# ------------------------
# Pet
# ------------------------
class Pet(models.Model):
    Name = models.CharField(max_length=100, default="unknown")
    Species = models.CharField(max_length=50, default="unknown")
    Breed = models.CharField(max_length=100, default="unknown")
    Age = models.IntegerField(default=0)
    Gender = models.CharField(max_length=10, default="unknown")
    Status = models.CharField(max_length=20, default="available")
    Shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name='pets')
    CreatedAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.Name


# ------------------------
# Adoption
# ------------------------
class Adoption(models.Model):
    Pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='adoptions')
    Adopter = models.ForeignKey('core.CustomUser', on_delete=models.CASCADE, related_name='adoptions')
    AdoptionDate = models.DateField(auto_now_add=True)
    Status = models.CharField(max_length=20, default="pending")

    def __str__(self):
        return f"Adoption: {self.Pet} by {self.Adopter}"


# ------------------------
# Veterinarian
# ------------------------
class Veterinarian(models.Model):
    Name = models.CharField(max_length=100, default="unknown")
    Specialization = models.CharField(max_length=100, default="general")
    Contact = models.CharField(max_length=50, default="unknown")

    def __str__(self):
        return self.Name


# ------------------------
# VetAppointment
# ------------------------
class VetAppointment(models.Model):
    Pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='vet_appointments')
    Vet = models.ForeignKey(Veterinarian, on_delete=models.CASCADE, related_name='appointments')
    AppointmentDate = models.DateField(auto_now_add=True)
    Reason = models.CharField(max_length=200, default="Checkup")
    Notes = models.TextField(default="")

    def __str__(self):
        return f"Appointment: {self.Pet} with {self.Vet}"


# ------------------------
# MedicalRecord
# ------------------------
class MedicalRecord(models.Model):
    Pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='medical_records')
    Vaccine = models.CharField(max_length=100, default="unknown")
    Treatment = models.CharField(max_length=200, default="unknown")
    RecordDate = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Medical Record for {self.Pet}"


# ------------------------
# Donation
# ------------------------
class Donation(models.Model):
    Shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name='donations')
    User = models.ForeignKey('core.CustomUser', on_delete=models.CASCADE, related_name='donations')
    Amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    DonationDate = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Donation {self.Amount} by {self.User}"
