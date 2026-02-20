import nh3

def sanitize_user_input(data):
    """
    Function which sanitizes the user's inputs.
    """
    for key in data:
        if type(data[key]) == str:
            data[key]=nh3.clean(data[key])
    return data

