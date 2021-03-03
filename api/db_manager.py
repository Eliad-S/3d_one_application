from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
engine = create_engine('sqlite:///dbdir/models.db', convert_unicode=True)
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime


class Model(Base):
    __tablename__ = 'model'
    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)
    ply_file = Column(String(20), unique=False, nullable=False)
    img_file = Column(String(20), unique=False, nullable=False)
    creation_date = Column(DateTime(20), nullable=False, default=datetime.utcnow)
    NOframes = Column(Integer, unique=False, nullable=False,default=4)

    def __init__(self, name, ply_file='default.ply', img_file='default.jpg', number_of_frames=4):
        self.name = name
        self.ply_file = ply_file
        self.img_file = img_file
        self.number_of_frames = number_of_frames

    def __repr__(self):
        return f'Model({self.name}, {self.ply_file}, {self.img_file},' \
               f' {self.creation_date}, {self.NOframes})'

    @property
    def serialize(self):
        """Return object data in easily serializable format"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

def init_db():
    Base.metadata.create_all(bind=engine)

def reset_db():
    meta = Base.metadata
    for table in reversed(meta.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()


def add_item(name, ply_file, img_file):
    m = Model(name, ply_file, img_file)
    db_session.add(m)
    db_session.commit()

def delete_item():
    pass

def get_all():
    return Model.query.all()

# m = Model("eliads")
# db_session.add(m)
# db_session.commit()
# init_db()
# reset_db()

