import logging
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.config import Config

logger = logging.getLogger(__name__)

class MongoDatabaseManager:
    def __init__(self, mongo_uri=None, allow_memory_fallback=None, use_memory=False):
        self.client = None
        self.db = None
        self.is_connected = False
        self.mongo_uri = mongo_uri or Config.MONGO_URI
        self.allow_memory_fallback = (
            Config.ALLOW_IN_MEMORY_DB
            if allow_memory_fallback is None
            else allow_memory_fallback
        )
        self.use_memory = use_memory
        self._in_memory_store = {
            "users": {},
            "learner_profiles": {},
            "roadmaps": {},
            "lessons": {},
            "assessments": {},
            "results": {},
            "performance": {},
            "recommendations": {},
            "notifications": {},
        }
        self.init_db()

    def init_db(self):
        if self.use_memory:
            logger.warning("Using the isolated in-memory database configured for this app.")
            return

        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            self.client.admin.command("ping")
            self.db = self.client.get_database()
            self.db.users.create_index("email", unique=True)
            self.db.token_blocklist.create_index("jti", unique=True)
            self.db.token_blocklist.create_index("expires_at", expireAfterSeconds=0)
            self.db.content_cache.create_index("cache_key", unique=True)
            self.db.content_cache.create_index("expires_at", expireAfterSeconds=0)
            self.is_connected = True
            logger.info("Successfully connected to MongoDB Database.")
        except PyMongoError as e:
            self.is_connected = False
            if not self.allow_memory_fallback:
                raise RuntimeError("MongoDB is unavailable and in-memory fallback is disabled.") from e
            logger.warning("MongoDB unavailable; using the explicitly enabled in-memory fallback: %s", e)

    def get_collection(self, collection_name: str):
        if self.is_connected and self.db is not None:
            return MongoCollectionWrapper(self.db[collection_name])
        return InMemoryCollectionWrapper(self._in_memory_store, collection_name)

class MongoCollectionWrapper:
    def __init__(self, collection):
        self.coll = collection

    def find_one(self, query):
        res = self.coll.find_one(query)
        if res and "_id" in res:
            res["_id"] = str(res["_id"])
        return res

    def find(self, query=None):
        query = query or {}
        items = list(self.coll.find(query))
        for item in items:
            if "_id" in item:
                item["_id"] = str(item["_id"])
        return items

    def insert_one(self, doc):
        res = self.coll.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return doc

    def update_one(self, query, update_data, upsert=False):
        return self.coll.update_one(query, update_data, upsert=upsert)

    def delete_one(self, query):
        return self.coll.delete_one(query)

class InMemoryCollectionWrapper:
    def __init__(self, store: dict, name: str):
        self.store = store
        self.name = name
        if name not in self.store:
            self.store[name] = {}

    def find_one(self, query: dict):
        for item in self.store[self.name].values():
            if all(item.get(k) == v for k, v in query.items()):
                return dict(item)
        return None

    def find(self, query: dict = None):
        query = query or {}
        results = []
        for item in self.store[self.name].values():
            if all(item.get(k) == v for k, v in query.items()):
                results.append(dict(item))
        return results

    def insert_one(self, doc: dict):
        doc_id = doc.get("id") or doc.get("_id") or f"doc_{len(self.store[self.name]) + 1}"
        doc["id"] = doc_id
        doc["_id"] = doc_id
        self.store[self.name][doc_id] = dict(doc)
        return doc

    def update_one(self, query: dict, update_data: dict, upsert: bool = False):
        existing = self.find_one(query)
        if existing:
            doc_id = existing["id"]
            set_data = update_data.get("$set", {})
            self.store[self.name][doc_id].update(set_data)
        elif upsert:
            set_data = update_data.get("$set", {})
            self.insert_one(set_data)

    def delete_one(self, query: dict):
        existing = self.find_one(query)
        if existing:
            doc_id = existing["id"]
            del self.store[self.name][doc_id]

db_manager = MongoDatabaseManager()

def get_db():
    return db_manager
