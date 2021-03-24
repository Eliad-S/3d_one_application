import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float
from db_manager import Base, engine
from hurry.filesize import size


class Model(Base):
    __tablename__ = 'model'
    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)
    model_url = Column(String(20), unique=False, nullable=False)
    img_url = Column(String(20), unique=False, nullable=False)
    size = Column(String(80), unique=False, nullable=False)
    creation_date = Column(DateTime(20), nullable=False, default=datetime.utcnow)
    number_of_frames = Column(Integer, unique=False, nullable=False, default=4)


    def __init__(self, name, model_url='default.obj', img_url='default.jpg', number_of_frames=4):
        self.name = name
        self.model_url = model_url
        self.img_url = img_url
        self.number_of_frames = number_of_frames
        size_bytes = os.path.getsize(f'my_models/{name}.obj')
        print(f"\nThe size of {model_url} is :{self.size} Bytes")
        self.size = size(size_bytes) + 'B'


    def __repr__(self):
        return f'Model({self.name}, {self.model_url}, {self.img_url},' \
               f'{self.size}, {self.creation_date}, {self.number_of_frames})'

    @property
    def serialize(self):
        """Return object data in easily serializable format"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

def init_db():
    if os.path.exists("dbdir/models.db"):
        os.remove("dbdir/models.db")
    Base.metadata.create_all(bind=engine)
# init_db()