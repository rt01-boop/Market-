
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)
    is_seller = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    price = Column(Float)
    seller_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String)
