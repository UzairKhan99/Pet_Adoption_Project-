from django.contrib import admin
from django.urls import path
from core import api

urlpatterns = [
    path("admin/", admin.site.urls),

    # -------------------------------
    # AUTHENTICATION
    # -------------------------------
    path("register/", api.register),
    path("login/", api.user_login),

    # -------------------------------
    # USER READ-ONLY ENDPOINTS
    # -------------------------------
    path("shelters/", api.shelters_view),
    path("shelters/<int:id>/", api.shelter_view),

    path("pets/", api.pets),
    path("pets/<int:id>/", api.pet_detail),

    path("vets/view/", api.vets_view),

    # -------------------------------
    # USER PERSONAL DATA ENDPOINTS
    # -------------------------------
    path("adoptions/", api.adoptions),
    path("donations/", api.donations),

    path("appointments/my/", api.my_appointments),
    path("medical-records/my/", api.my_medical_records),

    # -------------------------------
    # ADMIN-ONLY ENDPOINTS
    # -------------------------------
    # Shelters Admin
    path("adm/shelters/", api.shelters_admin),
    path("adm/shelters/<int:id>/", api.shelter_detail_admin),

    # Pets Admin
    path("adm/pets/", api.pets_admin),
    path("adm/pets/<int:id>/", api.pet_detail_admin),

    # Vets Admin
    path("adm/vets/", api.vets),

    # Appointments Admin
    path("adm/appointments/", api.appointments),

    # Medical Records Admin
    path("adm/medical-records/", api.medical_records),

    # Adoption moderation
    path("adm/adoptions/<int:id>/", api.adoption_detail_admin),
]
