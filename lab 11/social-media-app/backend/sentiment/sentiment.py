from flask import Flask, request, jsonify
from textblob import TextBlob

app = Flask(__name__)

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    content = data.get('content', '')
    analysis = TextBlob(content)
    polarity = analysis.sentiment.polarity
    sentiment = 'positive' if polarity > 0 else 'negative' if polarity < 0 else 'neutral'
    return jsonify({'sentiment': sentiment})

if __name__ == '__main__':
    app.run(port=5006)
