import json
import os

file_name = "setting.json"


class Setting_Manager:
    def __init__(self):
        if not os.path.isfile("setting.json"):
            print("creating deafualt settings")
            self.create_defualt_json()
        else:
            self.load_file()
            print("loading settings")
            print(self.data)

    def modify_val(self, to_modify, new_val):
        try:
            with open(file_name, 'r+') as f:
                json_data = json.load(f)
                if to_modify in json_data.keys():
                    json_data[to_modify] = new_val  # <--- add `id` value.
                    print(json_data)
                else:
                    return
                f.seek(0)  # <--- should reset file position to the beginning.
                json.dump(json_data, f, indent=4)
                f.truncate()  # remove remaining part
                self.data = json_data
        except EnvironmentError:  # parent of IOError, OSError *and* WindowsError where available
            raise IOError("error occur while loading")

    def get_json(self):
        return self.data

    def get_val(self, name):
        return self.data[name]

    def create_defualt_json(self):
        settings = dict()
        settings['number_of_frames'] = 4
        settings['obj_distance'] = 0.6
        settings['obj_radius'] = 0.35
        settings['voice_control'] = True

        try:
            with open(file_name, 'w') as outfile:
                json.dump(settings, outfile, sort_keys=True, indent=4)
        except EnvironmentError:  # parent of IOError, OSError *and* WindowsError where available
            raise IOError("error, while creating json file")
        self.data = settings

    def load_file(self):
        try:
            with open("setting.json") as f:
                self.data = json.load(f)
        except IOError as e:
            print(e)
        except Exception as e:
            print(e)
