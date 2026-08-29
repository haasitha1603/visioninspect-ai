from PIL import Image


def preprocess_image(image_path, output_path):
    image = Image.open(image_path)

    image = image.convert("RGB")

    image = image.resize((256, 256))

    image.save(output_path)

    return image.size