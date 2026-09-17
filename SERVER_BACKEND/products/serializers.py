from rest_framework import serializers
from orders.models import OrderItem
from .models import Product, ProductImage, Review
from utils.sanitizeUserInput import sanitize_user_input
from django.db.models import Avg, Count

class ProductImageSerializer(serializers.ModelSerializer):
    """    
    Serializer for the ProductImage model, 
    used for getting a product image from the databse and sending it to the client.

    More details about Serialization and Deserialization:

    Serialization (GET):
        When the client app makes a GET request, the serializer converts
        Product model instances into native Python datatypes. These
        datatypes are later rendered into JSON by DRF's JSONRenderer
        when returning the response to the client.

    Deserialization (POST/PUT/PATCH):
        When the client app sends JSON data to create or update a product,
        DRF's JSONParser first converts the raw JSON payload into Python
        datatypes and places them in request.data. The serializer then
        converts these Python datatypes into validated data that can be
        used to create or update Product model instances.
    """

    # declare a read-only serializer field whose value is computed by a method (in this case, get_cover_url())
    # instead of coming directly from the model.
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "alt_text", "createdAt", "updatedAt"]

    def get_image_url(self, obj):
        """
        Return an absolute URL to the image so the frontend can load it directly.

        This method must be called get_image_url(), because of the 
        image_url = serializers.SerializerMethodField() property:
        
        <field_name> = SerializerMethodField()
                ↓
        def get_<field_name>(self, obj): ...

        """
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url
    
class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer user for retrieving a review from the database and sending it to the client.
    """
    class Meta:
        model = Review
        fields = "__all__"

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer used for retrieving product(s) and sending to the client.
    """
    # declares a read-only serializer field whose value is computed by a method (in this case, get_image_url())
    # instead of coming directly from the model.
    cover_url = serializers.SerializerMethodField(read_only=True)
    
    # declares a read-only serializer field whose value is computed by a method (in this case, get_reviews())
    # instead of coming directly from the model.
    reviews = serializers.SerializerMethodField(read_only=True)

    # Nested serialization: includes all ProductImage objects related to this Product
    # (accessible via related_name="images" / product.images.all()) as a read-only list
    # in the API response. 
    # 
    # This is required, because the Meta class for this serializer only includes the Product model.
    #
    # During serialization, DRF automatically accesses product.images.all() for this field.
    # When serializing a LIST of products, this would normally trigger one additional database
    # query per product to load its related images (the N+1 query problem).
    #
    # Using prefetch_related("images") in the API view fetches all related images in a single
    # extra query and avoids those per-product queries.
    gallery_images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = "__all__"

    def get_cover_url(self, obj):
        """
        Return an absolute URL to the image so the frontend can load it directly.

        This method must be called get_cover_url(), because of the 
        cover_url = serializers.SerializerMethodField() property:

        <field_name> = SerializerMethodField()
                ↓
        def get_<field_name>(self, obj): ...

        This can be used if the storage backend changes (for example, to Amazon S3)
        """
        # Change `obj.cover_img` to whatever your ImageField is actually named
        if not getattr(obj, "cover_img", None):
            return None

        request = self.context.get("request")
        url = obj.cover_img.url  # e.g. /media/products/foo.jpg

        return request.build_absolute_uri(url) if request else url


    def get_reviews(self, obj):
        """Method, which gets all the reviews for the product."""
        # reviews = obj.review_set.all()
        reviews = Review.objects.filter(product=obj)
        serializer = ReviewSerializer(reviews, many=True)
        return serializer.data


class CreateProductSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating a product.
    """

    class Meta:
        model = Product
        # include the fields you allow the client to set on create
        fields = [
            "name",
            "price",
            "brand",
            "category",
            "countInStock",
            "description",
            "cover_img",
        ]
        read_only_fields = ["id", "user", "createdAt", "updatedAt", "rating", "numReviews"]

        extra_kwargs = {
            "name": {
                "error_messages": {
                    "blank": "Product name cannot be empty.",
                    "max_length": "Product name is too long.",
                }
            },
            "brand": {
                "error_messages": {
                    "blank": "Brand is required.",
                    "max_length": "Brand name is too long.",
                }
            },
            "category": {
                "error_messages": {
                    "blank": "Category is required.",
                    "max_length": "Category name is too long.",
                }
            },
            "price": {
                "error_messages": {"invalid": "Enter a valid price."}
            },
        }

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate(self, data):
        return sanitize_user_input(data)


class CreateReviewSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating a review. The serializer also validates:
      - whether product exists
      - if the user has bought the product
      - if the user hasn't already reviewed this product
      - if the rating is provided and is > 0
    """

    class Meta:
        model = Review
        fields = ["rating", "comment"]

    def validate_rating(self, value):
        """
        Method, which validates whether the rating exists and is greater than 0.
        """
        if not value or value <= 0:
            raise serializers.ValidationError("Please select a rating.")
        return value

    def validate(self, data):
        """
        Method, verifies sanitizes the user's input, 
        and verifies whether the user has already reviewed the product.
        """
        data = sanitize_user_input(data)

        request = self.context["request"]
        product = self.context["product"]

        # make sure product exists (not necessarily needed because the view already does this)
        if product is None:
            raise serializers.ValidationError({"product": "Product not found."})

        # Check whether the current user has purchased the product
        has_bought_product = OrderItem.objects.filter(
            product=product,
            order__user=request.user,
            order__isPaid=True,
        ).exists()

        if not has_bought_product:
            raise serializers.ValidationError(
                {"review": "You can only review products you have purchased."}
            )
        
        # Check if user already reviewed
        if Review.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError({"review": "Product is already reviewed."})

        return data

    def create(self, validated_data):
        """
        Method, which adds the review to the database, and
        updates the product's average rating and number of reviews.
        """
        request = self.context["request"]
        product = self.context["product"]

        # Create review
        review = Review.objects.create(
            user=request.user,
            product=product,
            name=request.user.username,
            rating=validated_data["rating"],
            comment=validated_data["comment"],
        )

        #  # Update the number of reviews 
        #  reviews = product.review_set.all()
        #  product.numReviews = len(reviews)

        #  # Calculate the average rating
        #  total = 0
        #  for review in reviews:
        #       total += review.rating
        #  product.rating = total / len(reviews)

        # Update product aggregates efficiently
        # Update the average rating and the number of reviews
        agg = Review.objects.filter(product=product).aggregate(
            avg_rating=Avg("rating"),
            count_reviews=Count("id"),
        )
        product.rating = agg["avg_rating"] or 0
        product.numReviews = agg["count_reviews"] or 0
        
        product.save()

        return review



