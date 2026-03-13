from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from groq import Groq

router = APIRouter()

# Initialize Groq client
client = None
if os.environ.get("GROQ_API_KEY"):
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

class Answer(BaseModel):
    id: str
    author_name: str
    voice_url: Optional[str] = None
    text_content: str
    timestamp: datetime

class CommunityPost(BaseModel):
    id: str
    author_name: str
    title: str
    voice_url: Optional[str] = None
    text_content: str
    tags: List[str]
    answers: List[Answer]
    timestamp: datetime
    location_cluster: str

class TagRequest(BaseModel):
    text: str

# Mock database
posts_db: List[CommunityPost] = [
    CommunityPost(
        id="1",
        author_name="Ramesh Rao",
        title="Tomato Late Blight issues",
        text_content="Is anyone else seeing black spots on their tomato leaves after the sudden rain?",
        tags=["#Tomato", "#Disease"],
        answers=[
            Answer(
                id="a1",
                author_name="Suresh K",
                text_content="Yes, ramesh. I used copper-based spray and it helped. Don't wait.",
                timestamp=datetime.now()
            )
        ],
        timestamp=datetime.now(),
        location_cluster="Nashik-West"
    ),
    CommunityPost(
        id="2",
        author_name="Anil Kumar",
        title="Best storage for Onions",
        text_content="Thinking of crated storage for my next harvest. Worth it?",
        tags=["#Onion", "#Storage"],
        answers=[],
        timestamp=datetime.now(),
        location_cluster="Pune-Rural"
    )
]

@router.get("/posts", response_model=List[CommunityPost])
def get_posts(cluster: Optional[str] = None):
    if cluster:
        return [p for p in posts_db if p.location_cluster == cluster]
    return posts_db

@router.post("/posts", response_model=CommunityPost)
def create_post(post: CommunityPost):
    posts_db.insert(0, post)
    return post

@router.post("/tag")
def tag_post(req: TagRequest):
    """
    Uses LLM to automatically categorize a post by crop and topic.
    """
    if not client:
        # Fallback tagging
        tags = []
        lower_text = req.text.lower()
        if "tomato" in lower_text or "tamatar" in lower_text: tags.append("#Tomato")
        if "onion" in lower_text or "kanda" in lower_text: tags.append("#Onion")
        if "disease" in lower_text or "rog" in lower_text: tags.append("#Disease")
        if "price" in lower_text or "bhav" in lower_text: tags.append("#Price")
        return {"tags": tags if tags else ["#General"]}

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a specialized tagging bot for an Indian agri-community forum. Extract 1-3 relevant hashtags (e.g., #Tomato, #Onion, #Price, #Disease, #Weather, #Logistics) from the text. Return ONLY the hashtags separated by spaces."},
                {"role": "user", "content": req.text}
            ],
            temperature=0.0,
            max_tokens=50
        )
        tags_str = completion.choices[0].message.content.strip()
        tags = [tag.strip() for tag in tags_str.split() if tag.startswith("#")]
        return {"tags": tags if tags else ["#General"]}
    except Exception as e:
        print(f"Tagging error: {e}")
        return {"tags": ["#General"]}

@router.post("/notify_shock")
def notify_cluster_shock(data: Dict[str, Any]):
    """
    Push a notification to all members of a cluster if a shock is reported.
    In a real implementation, this would integrate with Firebase Cloud Messaging (FCM).
    """
    cluster = data.get("cluster")
    report_type = data.get("type") # 'PriceDrop' or 'PestAlert'
    message = data.get("message")
    
    print(f"NOTIFY: Sending {report_type} alert to all members in cluster {cluster}: {message}")
    
    return {"status": "success", "notified_cluster": cluster}
