from django.urls import path
from .views import ProductDetailDeleteApiView,\
      ProductDetailGetApiView, ProductDetailUpdateApiView, ProductFilterOptionsView,\
      ProductGalleryImageDeleteView, ProductListApiView, ProductCreateApiView, ReviewDetailView


urlpatterns = [
    path("filters/", ProductFilterOptionsView.as_view(), name="prpduct_filters"),
    path('get/', ProductListApiView.as_view(), name="product_list_create"),
    path('create/', ProductCreateApiView.as_view(), name="product_list_create"),
    path('get/<int:id>/', ProductDetailGetApiView.as_view(), name="product_detail_create"),
    path('update/<int:id>/', ProductDetailUpdateApiView.as_view(), name="product_detail_create"),
    path('delete/<int:id>/', ProductDetailDeleteApiView.as_view(), name="product_detail_delete"),
    path("delete/<int:product_id>/gallery/<int:image_id>/", ProductGalleryImageDeleteView.as_view(), name="product_detail_delete_gallery_img"),
    path("<int:id>/review/", ReviewDetailView.as_view(), name="review_detail")
]