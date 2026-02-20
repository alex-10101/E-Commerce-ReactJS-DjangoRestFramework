from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from django.conf import settings
from .serializers import CreateProductSerializer, CreateReviewSerializer, ProductSerializer
from .models import Product, ProductImage, Review
from django.db.models import Q
import os, shutil
from django.db import transaction
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination

# Create your views here.

class ProductListApiView(APIView):
    """
    Class Based view for returning a Paginated product list, optionally filtered by query params.

    Query params (0 or more each), for example:
      - brand=Canon-Nikon
      - category=Cameras-Lenses

    Filtering based on query params:
      - If brands provided -> brand IN brands
      - If categories provided -> category IN categories
      - If both -> AND between groups
      - If none -> returns first page of all products (still paginated)
    """    
    def __get_list_of_category_values(self, param: str) -> list[str]:
        """
        Returns a list of all values of a category.
        
        :param params: A request parameters, for example brand or category.
        """
        if not param:
            return []
        return [param_value.strip() for param_value in param.split("-") if param_value.strip()]

    def get(self, request):
        """
        Get all products. 
        """
        filtered_products = (
            Product.objects
            # Fetch all related ProductImage objects for the selected Product(s) in advance, 
            # using a separate query, and cache them on each Product instance.

            # 1 query for all products
            # 1 query for all images whose product_id is in that product list:
            # SELECT * FROM product_image WHERE product_id IN <that product list>;
            # It then “attaches” the images to each product in memory.
            .prefetch_related("gallery_images")
            .order_by("-createdAt")
        )

        # Filtering based on query parameters
        params = self.request.query_params

        brands = self.__get_list_of_category_values(params.get("brand"))
        categories = self.__get_list_of_category_values(params.get("category"))

        if brands:
            filtered_products = filtered_products.filter(brand__in=brands)

        if categories:
            filtered_products = filtered_products.filter(category__in=categories)


        # PAGINATION

        # Read the requested page number from the query parameters (?page=2, ?page=5, etc.)
        # If the client does not send a page parameter, this will be None.        
        page = request.query_params.get("page")

        # Create a paginator over the *already filtered* queryset.
        # This splits the queryset into chunks ("pages") of 4 products each (4 products per page):
        #       page 1 -> products[0:4]
        #       page 2 -> products[4:8]
        #       page 3 -> products[8:12]
        #               ...
        paginator = Paginator(filtered_products, 4)  # page size = 4 products per page

        try:
            # Attempt to return the requested page.
            # If page="2", this returns the 2nd chunk of 4 products.
            products_page = paginator.page(page)
        except PageNotAnInteger:
            # If 'page' is not an integer (e.g. "abc" or None),
            # fall back to the first page.            
            products_page = paginator.page(1)
        except EmptyPage:
            # If the requested page number is larger than the total number of pages
            # (e.g. page=10 but only 3 pages exist),
            # return the *last valid page* instead.            
            products_page = paginator.page(paginator.num_pages)

        # Normalize the page number that will be returned to the client.
        # If the client did not provide a page parameter, we are effectively on page 1.
        if page is None:
            page = 1
        page = int(page)

        # Serialize ONLY the products belonging to the current page.
        # `products_page` is a Django Page object that behaves like a list.
        serializer = ProductSerializer(
            products_page, many=True, context={"request": request}
        )

        # Return a structured pagination response:
        # - "products": the products on the current page only
        # - "page": the current page number (1-based)
        # - "pages": total number of pages available for this filtered queryset
        return Response(
            {
                "products": serializer.data,
                "page": page,
                "pages": paginator.num_pages,
            },
            status=status.HTTP_200_OK,
        )

# class ProductListApiView(APIView):
#     """
#     Class Based view for returning a Paginated product list, optionally filtered by query params.

#     Query params (0 or more each), for example:
#       - brand=Canon-Nikon
#       - category=Cameras-Lenses

#     Logic:
#       - If brands provided -> brand IN brands
#       - If categories provided -> category IN categories
#       - If both -> AND between groups
#       - If none -> returns first page of all products (still paginated)
#     """    
#     def __get_list_of_category_values(self, param: str) -> list[str]:
#         """
#         Returns a list of all values of a category.
        
#         :param params: A request parameters, for example brand or category.
#         """
#         if not param:
#             return []
#         return [param_value.strip() for param_value in param.split("-") if param_value.strip()]

#     def get(self, request):
#         """
#         Get all products. 
#         """
#         filtered_products = (
#             Product.objects
#             # Fetch all related ProductImage objects for the selected Product(s) in advance, 
#             # using a separate query, and cache them on each Product instance.

#             # 1 query for all products
#             # 1 query for all images whose product_id is in that product list:
#             # SELECT * FROM product_image WHERE product_id IN <that product list>;
#             # It then “attaches” the images to each product in memory.
#             .prefetch_related("gallery_images")
#             .order_by("-createdAt")
#         )

#         # Filtering based on query parameters
#         params = self.request.query_params

#         brands = self.__get_list_of_category_values(params.get("brand"))
#         categories = self.__get_list_of_category_values(params.get("category"))

#         if brands:
#             filtered_products = filtered_products.filter(brand__in=brands)

#         if categories:
#             filtered_products = filtered_products.filter(category__in=categories)


#         # PAGINATION

#         paginator = PageNumberPagination()
#         paginator.page_size = 4  # page size here (4 items per page)

#         result_page = paginator.paginate_queryset(filtered_products, request)

#         serializer = ProductSerializer(result_page, many=True, context={"request": request})

#         # return Response(serializer.data, status=status.HTTP_200_OK)

#         # Return a structured pagination response:
#         # - "products": the products on the current page only
#         # - "page": the current page number (1-based)
#         # - "pages": total number of pages available for this filtered queryset
#         return Response(
#             {
#                 "products": serializer.data,
#                 "page": paginator.page.number,
#                 "pages": paginator.page.paginator.num_pages,
#             },
#             status=status.HTTP_200_OK,
#         )


class ProductCreateApiView(APIView):
    """
    Class Based View for creating a product.
    """

    permissions = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        """
        Insert a new product in the database.
        """

        # IDEEA: the cover img should be saved inside the folder named after the primary key of the product,
        # PROBLEM: the product is NOT YET CREATED, so the primary key of the product DOES NOT EXIST YET.
        # --> Save the cover img in memory, and remove the cover img from the request data,
        # to prevent saving it before pk exists
        cover_file = request.FILES.get("cover_img")
        if cover_file:
            request.data.pop("cover_img", None)  

        # serializer = ProductSerializer(data=data)
        serializer = CreateProductSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # In ProductSerializer, the user is read only. 
            # So, set the user who created the product in this view using serializer.save().
            product = serializer.save(user = request.user)
    
            # Upload to products/<pk>/cover/...        
            if cover_file:
                product.cover_img = cover_file            
                product.save()
 
            
            # Optional gallery images (multiple files)
            for file in request.FILES.getlist("gallery_images"):
                ProductImage.objects.create(product=product, image=file)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailGetApiView(APIView):
    """
    View for retrieving a particular product.
    """

    def __get_product(self, product_id):
        """
        Private method to get the product with the given id from the database.
        """
        try:
            return (
                Product.objects
                # Fetch all related ProductImage objects for the selected Product(s) in advance, 
                # using a separate query, and cache them on each Product instance.

                # 1 query for all products
                # 1 query for all images whose product_id is in that product list: 
                # SELECT * FROM product_image WHERE product_id IN <that product list>;
                # It then “attaches” the images to each product in memory.
                .prefetch_related("gallery_images")
                .get(id=product_id)
            )
        except Product.DoesNotExist:
            return None
        
    def get(self, request, id):
        """
        Get the product with the given id.
        """
        product = self.__get_product(id)

        if product is None:
            return Response(
                {"detail": "The product with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProductSerializer(product, context={"request": request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductDetailUpdateApiView(APIView):
    """
    View for updating a particular product.
    """

    permissions = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def __get_product(self, product_id):
        """
        Private method to get the product with the given id from the database.
        """
        try:
            return (
                Product.objects
                # Fetch all related ProductImage objects for the selected Product(s) in advance, 
                # using a separate query, and cache them on each Product instance.

                # 1 query for all products
                # 1 query for all images whose product_id is in that product list: 
                # SELECT * FROM product_image WHERE product_id IN <that product list>;
                # It then “attaches” the images to each product in memory.
                .prefetch_related("gallery_images")
                .get(id=product_id)
            )
        except Product.DoesNotExist:
            return None 
    
    def put(self, request, id):
        """
        Update the product with the given id.
        """

        product = self.__get_product(id)

        if product is None:
            return Response(
                {"detail": "The product with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Optional: replace cover image
        cover_file = request.FILES.get("cover_img")
        if cover_file:
            request.data["cover_img"] = cover_file
        
        # partial=True indicates it isn't neccesary to update all writeable fields of the Product instance. 
        # Some can remain unchanged. This is similar to a partial update, or PATCH request.
        # serializer = ProductSerializer(instance=product, data=request.data, partial=True)
        serializer = CreateProductSerializer(instance=product, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            updated_product = serializer.save()  # user unchanged (read-only in serializer)

            # Optional: add new gallery images
            for file in request.FILES.getlist("gallery_images"):
                ProductImage.objects.create(product=updated_product, image=file)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductDetailDeleteApiView(APIView):
    """
    View for deleting a particular product.
    """

    permissions = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def __get_product(self, product_id):
        """
        Private method to get the product with the given id from the database.
        """
        try:
            return (
                Product.objects
                # Fetch all related ProductImage objects for the selected Product(s) in advance, 
                # using a separate query, and cache them on each Product instance.

                # 1 query for all products
                # 1 query for all images whose product_id is in that product list: 
                # SELECT * FROM product_image WHERE product_id IN <that product list>;
                # It then “attaches” the images to each product in memory.
                .prefetch_related("gallery_images")
                .get(id=product_id)
            )
        except Product.DoesNotExist:
            return None 

    def delete(self, request, id):
        """
        Delete the product with the given id.
        """
        product = self.__get_product(id)

        if product is None:
            return Response(
                {"detail": "The product with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build path: MEDIA_ROOT/products/<product_id>
        product_media_path = os.path.join(
            settings.MEDIA_ROOT,
            "products",
            str(product.id),
        )

        product.delete()

        # Delete files from disk
        if os.path.isdir(product_media_path):
            shutil.rmtree(product_media_path)

        return Response(status=status.HTTP_204_NO_CONTENT)



class ProductGalleryImageDeleteView(APIView):
    """
    Class based view for deleting a particular galery image for a particular product. 
    """

    permissions = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def delete(self, request, product_id, image_id):

        try: 
            image_db = ProductImage.objects.get(id=image_id, product_id=product_id)
        except ProductImage.DoesNotExist:
            image_db = None

        if image_db is None:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)


        with transaction.atomic():
            
            # delete file from disk if it exists
            if image_db.image and os.path.exists(image_db.image.path):
                os.unlink(image_db.image.path)            
                
            image_db.delete()
            

        return Response(status=status.HTTP_204_NO_CONTENT)

class ReviewDetailView(APIView):
    """
    Class based view for creating a review for a particular product. 
    """
    permission_classes = [permissions.IsAuthenticated]

    def __get_product(self, product_id):
        """
        Private method to get the product with the given id from the database.
        """
        try:
            return Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return None

    def post(self, request, id):
        """
        Method which creates a review for a product when the user makes a POST request to this endpoint.
       
         :param id: The id of the product for which the review is going to be made.
        """

        product = self.__get_product(id)

        if product is None:
            return Response(
                {"detail": "Product not found."}, 
                status=status.HTTP_404_NOT_FOUND
        )

        serializer = CreateReviewSerializer(
            data=request.data,
            context={"request": request, "product": product},
        )

        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(status=status.HTTP_201_CREATED)
    

class ProductFilterOptionsView(APIView):
    """
    Class Based View for retrieving all distinct product brands and categories.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        """
        Retrieve all distinct product brands and categories when the user makes a GET request to this endpoint.    
        """
        brands = (
            Product.objects
            .values_list("brand", flat=True)
            .distinct()
            .order_by("brand")
        )

        categories = (
            Product.objects
            .values_list("category", flat=True)
            .distinct()
            .order_by("category")
        )

        return Response({
            "brands": list(brands),
            "categories": list(categories),
        }, status=status.HTTP_200_OK)