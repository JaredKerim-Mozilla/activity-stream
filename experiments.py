import json


def dict_to_md(data, depth=1):
    if type(data) is dict:
        output = ''
        for key, value in data.items():
            output += '{prefix}{row}\n{child}\n'.format(
                prefix='#' * depth,
                row=key,
                child=dict_to_md(value, depth+1)
            )
        return output
    else:
        return str(data)


with open('experiments.json', 'rb') as experiments_file:
    experiments_data = json.loads(experiments_file.read())

    print dict_to_md(experiments_data)
