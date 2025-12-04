from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend_jobs():
    data = request.get_json()
    user_skills = data['user_skills']
    jobs = data['jobs']

    if not jobs:
        return jsonify([])

    # Combine user and job skills for vectorization
    documents = [user_skills] + [job['skills_required'] for job in jobs]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)

    # Compute cosine similarity between user skills and job skills
    user_vector = tfidf_matrix[0:1]
    job_vectors = tfidf_matrix[1:]
    similarities = cosine_similarity(user_vector, job_vectors).flatten()

    # Return top 3 job IDs sorted by similarity
    job_ids = [job['id'] for job in jobs]
    recommendations = sorted(zip(job_ids, similarities), key=lambda x: x[1], reverse=True)[:3]
    return jsonify([job_id for job_id, _ in recommendations if _ > 0])

if __name__ == '__main__':
    app.run(port=5003)