from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health),
    path("rooms", views.create_room),
    path("rooms/<str:code>", views.room_info),
    path("rooms/<str:code>/join", views.join_room),
    path("rooms/<str:code>/state", views.room_state),
    path("rooms/<str:code>/start", views.start_game),
    path("rooms/<str:code>/guess", views.submit_guess),
    path("rooms/<str:code>/next", views.next_round),
    path("rooms/<str:code>/leave", views.leave_room),
]
