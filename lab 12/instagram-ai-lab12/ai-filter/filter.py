from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageFilter
from skimage import exposure
import io, base64, requests

app = Flask(__name__)
CORS(app)

def apply_filter(img, filter_type):
    if filter_type == "vintage":
        img = img.convert("RGBA")
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        img = img.filter(ImageFilter.GaussianBlur(1))
    elif filter_type == "sunset":
        img = exposure.adjust_gamma(img, 0.8)
        img = ImageEnhance.Color(img).enhance(1.5)
    elif filter_type == "bw":
        img = img.convert("L").convert("RGB")
    return img

@app.route('/apply-filter', methods=['POST'])
def apply_filter_endpoint():
    data = request.get_json()
    image_url = data['image_url']
    filter_type = data['filter']

    if image_url.startswith("data:image"):
        img_data = base64.b64decode(image_url.split(",")[1])
        img = Image.open(io.BytesIO(img_data))
    else:
        response = requests.get(image_url)
        img = Image.open(io.BytesIO(response.content))

    filtered_img = apply_filter(img, filter_type)
    buffer = io.BytesIO()
    filtered_img.save(buffer, format="JPEG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return jsonify({"filtered_image": f"data:image/jpeg;base64,{img_str}"})

if __name__ == "__main__":
    app.run(port=5006)
