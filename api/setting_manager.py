import json

file_name = "setting.json"

def create_defualt_json():
    data = dict()
    data['number_of_frames'] = 4
    data['obj_distance'] = 0.6
    data['obj_radius'] = 0.35
    data['voice_control'] = True


    try:
        with open(file_name, 'w') as outfile:
            json.dump(data, outfile, sort_keys=True, indent=4)
    except EnvironmentError:  # parent of IOError, OSError *and* WindowsError where available
        raise IOError("error, while creating json file")
    return data


class Setting_Manager:
    def __init__(self):
        self.data = create_defualt_json()

    def modify_val(self, to_modify, new_val):
        try:
            with open(file_name, 'r+') as f:
                json_data = json.load(f)
                if to_modify in json_data.keys():
                    json_data[to_modify] = new_val  # <--- add `id` value.
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