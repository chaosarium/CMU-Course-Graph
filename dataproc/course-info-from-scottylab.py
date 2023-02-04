import cmu_course_api
import json
import re
import requests

course_catalog_link = "https://enr-apps.as.cmu.edu/assets/SOC/sched_layout_spring.htm"
r_courselist = requests.get(course_catalog_link)
FILE_NAME = "S23-full.txt"
sample_list = ["15-122", "15-112", "80-285", "21-127", "80-100"]


# dummy method to remove <tags> in html
def remove_tags(text):
    # TODO: use regular exression to retrieve more
   text = text.replace("<TR>","#")
   text = text.replace("</TR>","#")
   text = text.replace("<TD>","#")
   text = text.replace("</TD>","#")
   text = text.replace("<TD NOWRAP>","#")
   text = text.replace("&nbsp;","#")
   return text

# input htm in plain text
# return a list of course codes
# example: [15112, 15122, 80285, 80180]
def get_course_code(text):
    text = remove_tags(text)
    course_list = []
    tokens = text.split("#")
    #print(tokens)
    for token in tokens:
        obj = re.match(r"^\d{5}$", token)
        if obj != None:
            course_list.append(obj.group())
    return course_list


def add_dash(s):
    return s[:2] + "-" + s[2:]


# input list of corse keys (should work with/without dash)
# also input data from scottylab api
# export to FILE_NAME, overwrite if file exists
def write_data_to_file(course_list, data):
    f = open(FILE_NAME, "w")
    keywords = {"prereqs_obj": "prereq", "coreqs_obj": "coreq"}
    for sample in course_list:
        if sample.count("-") == 0:
            sample = add_dash(sample)
        course_info = ['\n']
        course_info.append("key:" + sample)
        course_info.append("name:" + data["courses"][sample]["name"])
        for keyword in keywords:
            if data["courses"][sample][keyword]["reqs_list"] != None:
                course_info.append(keywords[keyword] + ",".join(str(entry) for entry in data["courses"][sample][keyword]["reqs_list"]))
            else:
                course_info.append(keywords[keyword] + "None")
        f.write("\n".join(course_info))
    f.close()


# read from FILE_NAME
# construct a dictionary of courses ---> for json export
# for each course, all features are initialized to None
# update content by eval
# WARNING! may cause problem here ---> "if content.count("[") == 0:"
def read_data_from_file():
    sample_list = {}
    f = open(FILE_NAME, "r")
    current_course = None
    for line in f.readlines():
        if line == '\n':
            continue
        try:
            keyword = line.split(":")[0]
            content = line.split(":")[1].strip()
        
            if keyword == "key":
                course_key = content
                current_course = course_key

                #initialize
                sample_list[current_course] = dict()
                sample_list[current_course]["name"] = None
                sample_list[current_course]["antireq"] = None
                sample_list[current_course]["min-grade"] = None
                sample_list[current_course]["cross-listed"] = None
                sample_list[current_course]["prereq"] = None
                sample_list[current_course]["coreq"] = None
            else:
                if content.count("[") == 0:
                    sample_list[current_course][keyword] = content
                else:
                    sample_list[current_course][keyword] = eval(content)
        except:
            print(line)

    return sample_list


# optional: load data from scottylab api, may take a while
# retrieve data from course catalog and scottylab, according to course_list
# enable sample mode to work on fewer data, notice the given sample is not representative
def load_data(sample_mode = False, rescrape = False):
    if rescrape:
        if sample_mode:
            course_list = sample_list
        else:
            # get course keys from course catalog
            # in 15122 format, with no dash
            course_list = get_course_code(r_courselist.text)
        # get data from scottylab
        data = cmu_course_api.get_course_data("S")
        # export to local file, in gorgeous format, you are welcome :)
        write_data_to_file(course_list, data)
    # load into Python dictionary
    course_catalog = read_data_from_file()

    # export to json file
    with open('full_list.json', 'w') as json_file:
        json.dump(course_catalog, json_file)


load_data()

