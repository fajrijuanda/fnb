
import sys
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

def compress_image(image, max_width=1024, quality=80):
    """
    Compress and resize an image.
    
    Args:
        image: The image field file (UploadedFile).
        max_width: Maximum width of the image.
        quality: Quality of the compression (1-100).
        
    Returns:
        InMemoryUploadedFile: The compressed image file.
    """
    if not image:
        return image
    
    # Open the image using Pillow
    img = Image.open(image)
    
    # Convert to RGB if it's RGBA (for PNGs) to save as JPEG/WebP
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
        
    # Resize if width > max_width
    if img.width > max_width:
        output_size = (max_width, int(img.height * (max_width / img.width)))
        img = img.resize(output_size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output_io = BytesIO()
    
    # Determine format (keep original or force JPEG/WebP)
    # Let's default to WebP for modern efficiency, or JPEG for compatibility.
    # User asked for storage efficiency. WebP is great.
    # But let's stick to JPEG for broad compatibility unless requested otherwise, 
    # or keep original format if possible but compressed.
    # Actually, converting to JPEG is safest for size.
    
    img.save(output_io, format='JPEG', quality=quality, optimize=True)
    output_io.seek(0)
    
    # Create a new InMemoryUploadedFile
    new_image = InMemoryUploadedFile(
        output_io,
        'ImageField',
        f"{image.name.split('.')[0]}.jpg",
        'image/jpeg',
        sys.getsizeof(output_io),
        None
    )
    
    return new_image
