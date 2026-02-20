import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()

# Create your models here.

class Product(models.Model):
    """
    Represents a product listed in the store catalog. A Product defines general
    information about an item that can be purchased, including its name, brand,
    category, description, rating, and inventory information.

    Relationship Structure:
        - Many Products can be created by one User (an user with admin priviledges, not a customer).
        - The ForeignKey is placed in this model because Product is the *child* in
          this relationship: a Product depends on the User who created it, but the
          User does not depend on the Product. This follows database normalization
          and ensures the parent (User) remains independent.

        - on_delete=models.SET_NULL is used so that when a User is deleted, the
          Product remains in the database and does not lose its historical value.
          The 'user' field becomes NULL if the user is removed.

    Field Notes:
        - name, brand, category, and description describe catalog metadata.
        - rating uses MinValueValidator(0.0) to ensure non-negative values.
        - price uses MinValueValidator(0.01) to ensure the product always has a
          positive price.
        - countInStock and numReviews track store inventory and review metadata.
    """

    def upload_to(instance, filename: str) -> str:
        """
        Returns the path where the image will be uploaded.
        """
        # return f"products/{instance.name}/cover/{uuid.uuid4()}-{filename}"
        return f"products/{instance.pk}/cover/{uuid.uuid4()}-{filename}"


    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    cover_img = models.ImageField(null=True, blank=True, upload_to=upload_to) 
    brand = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    rating = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0, message="Rating cannot be negative.")])
    numReviews = models.PositiveIntegerField(null=True, blank=True, default=0)
    price = models.DecimalField(max_digits=7, decimal_places=2, validators=[MinValueValidator(0, message="Price cannot be negative.")])
    countInStock = models.PositiveIntegerField(null=True, blank=True, default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)


    def __str__(self):
        """
        Show the name of the product when querying the database in shell or when using Django Admin, instead of showing an
        unhelpful "<Product object>" label.
        """
        return self.name
    
class ProductImage(models.Model):
    """
    Model, which represents a single gallery image associated with a Product.

    This model is used to store additional images for a product (e.g. images
    shown in a carousel or slider). Each image belongs to exactly one Product.
    """
    
    def upload_to(instance, filename: str) -> str:
        """
        Returns the path where the image will be uploaded.
        """
        # return f"products/{instance.product.name}/gallery/{uuid.uuid4()}-{filename}"
        return f"products/{instance.product.pk}/gallery/{uuid.uuid4()}-{filename}"

    product = models.ForeignKey(Product, related_name="gallery_images", on_delete=models.CASCADE)
    image = models.ImageField(null=True, blank=True, upload_to=upload_to)
    alt_text = models.CharField(max_length=200, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Show the alt_text of the image when querying the database in shell or when using Django Admin, instead of showing an
        unhelpful "<ProductImages object>" label.
        """
        return self.alt_text


    class Meta:
        """
        Class, which ensures, that the gallery images are returned in a consistent order based on their primary key. 
        
        The ordering is based on the primary key, because it is sufficient that the images
        are queried in the same order every time. The images do not need a particular ranking.

        (Here we use this class for sorting, because sorting in views.py is more difficult, due to prefetch_related.)
        """
        ordering = ["id"]


    

class Review(models.Model):
    """
    Represents a written review of a Product by a User. Reviews typically contain
    a rating value and an optional comment.

    Relationship Structure:
        - Many Reviews belong to one Product.
        - Many Reviews belong to one User.

        The ForeignKeys are defined in this model because Review is the *child*
        entity: a Review depends on both a Product and a User to exist. The parent
        models (Product and User) remain independent.

        on_delete=models.CASCADE ensures that:
            - If a Product is deleted, all associated Reviews are also removed,
              since they no longer make sense without the product.
            - If a User is deleted, their Reviews are removed as well, since a
              review cannot exist without an author.

    Field Notes:
        - rating uses MinValueValidator(0.0) to ensure ratings cannot be negative.
        - comment allows optional text, enabling users to leave an explanation or
          feedback.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=200, null=True, blank=True)
    rating = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0, message="Rating cannot be negative.")])
    comment = models.TextField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Show the rating of the product when querying the database in shell or when using Django Admin instead of showing an
        unhelpful "<Review object>" label.
        """
        return str(self.rating)