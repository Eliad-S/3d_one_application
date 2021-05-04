import os

from sqlalchemy import create_engine, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine('sqlite:///dbdir/models.db', convert_unicode=True)
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()


def add_item(name, obj_url, img_url, size):
    from models import Model
    print(f'{name} {obj_url} {img_url}')
    try:
        print('start')
        sess = db_session()
        model = Model(name, obj_url, img_url, size)
        sess.add(model)
        print('\nADDING {}'.format(model))
        sess.flush()
    except IntegrityError:
        sess.rollback()
        existing = db_session.query(Model).filter_by(name=name).one()
        print('* INTEGRITY FAILURE, EMAIL IN USE: {}'.format(existing))
        return False
    except Exception as error:
        print(error)
        print("rollback")
        sess.rollback()
        return False
    else:
        sess.commit()
        print('* SUCCESS')
        return True


def delete_item(name, url_base):
    from models import Model
    obj_url = f'{url_base}/{name}.obj'
    img_url = f'{url_base}/{name}.jpg'
    sess = db_session()
    model = get_item(name)
    count = Model.query.filter_by(name=name).delete()
    if os.path.exists(img_url):
        os.remove(img_url)
    if os.path.exists(obj_url):
        os.remove(obj_url)
    sess.flush()
    sess.commit()
    return count


def get_all():
    from models import Model
    return Model.query.all()


def get_item(name):
    from models import Model
    print(name)
    return Model.query.filter_by(name=name).first()


def count(name):
    from models import Model
    sess = db_session()
    name_regexp = name + '(%)'
    count = sess.query(Model).filter(or_(Model.name.like(name), Model.name.like(name_regexp))).count()
    return count

# init_db()
