import cmu_course_api
import json
import re
import requests

course_catalog_link = "https://enr-apps.as.cmu.edu/assets/SOC/sched_layout_spring.htm"
r_coursecatalog = requests.get(course_catalog_link)
FILE_NAME = "S23-full.txt"
sample_list = ["15-122", "15-112", "80-285", "21-127", "80-100"]
course_information = {}

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
# return a list of course codes, dash optional
def get_course_code(text, dash = False):
    text = remove_tags(text)
    course_list = []
    tokens = text.split("#")
    #print(tokens)
    for token in tokens:
        obj = re.match(r"^\d{5}$", token)
        if obj != None:
            if add_dash:
                course_list.append(add_dash(obj.group()))
            else:
                course_list.append(obj.group())
    return course_list


def add_dash(s):
    return s[:2] + "-" + s[2:]


# input list of corse codes (should work with/without dash)
# also input data from scottylab api
# export to FILE_NAME, overwrite if file exists
def write_data_to_file(course_list, data):
    f = open(FILE_NAME, "w")
    #g = open("raw-data.txt", "w")
    keywords = {"prereqs_obj": "prereq", "coreqs_obj": "coreq"}
    for course_key in course_list:
        #g.write(repr(data["courses"][course_key]))
        #g.write("\n")
        if course_key.count("-") == 0:
            course_key = add_dash(course_key)
        course_info = ['\n']
        course_info.append("key:" + course_key)
        course_info.append("name:" + data["courses"][course_key]["name"])
        course_info.append("units:" + str(data["courses"][course_key]["units"]))
        if data["courses"][course_key]["desc"] != None:
            course_info.append("desc:" + data["courses"][course_key]["desc"])
        else:
            course_info.append("desc:" + "None")
        for keyword in keywords:
            if data["courses"][course_key][keyword]["reqs_list"] != None:
                course_info.append(keywords[keyword] + ":" + ",".join(str(entry) for entry in data["courses"][course_key][keyword]["reqs_list"]))
            else:
                course_info.append(keywords[keyword] + ":" + "None")
        f.write("\n".join(course_info))
    f.close()
    #g.close()

# read from FILE_NAME
# construct a dictionary of courses ---> for json export
# for each course, all features are initialized to None
# update content by eval
# WARNING! may cause problem here ---> "if ~(content[0] == "[" and content[-1] == "]"):"
def read_data_from_file():
    global course_information
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
                course_information[current_course] = dict()
                course_information[current_course]["name"] = None
                course_information[current_course]["units"] = None
                course_information[current_course]["desc"] = None
                course_information[current_course]["antireq"] = None
                course_information[current_course]["min-grade"] = None
                #course_information[current_course]["crosslisted"] = None
                course_information[current_course]["prereq"] = None
                course_information[current_course]["coreq"] = None
            else:
                if ~(content[0] == "[" and content[-1] == "]"):
                    if content == "None":
                        course_information[current_course][keyword] = None    
                    else:
                        course_information[current_course][keyword] = content
                else:
                    course_information[current_course][keyword] = eval(content)
        except:
            print(line)

    return 42


# optional: load data from scottylab api, may take a while
# retrieve data from course catalog and scottylab, according to course_list
# enable sample mode to work on fewer data, notice the given sample is not representative
def load_data(sample_mode = False, rescrape = False, dash = False):
    if rescrape:
        if sample_mode:
            course_list = sample_list
        else:
            # get course keys from course catalog
            # in 15122 format, with no dash
            course_list = get_course_code(r_coursecatalog.text, dash = dash)
        # get data from scottylab
        data = cmu_course_api.get_course_data("S")
        # export to local file, in gorgeous format, you are welcome :)
        write_data_to_file(course_list, data)
    # load into Python dictionary
    read_data_from_file()

    
def load_to_json():
    # export to json file
    with open('full_list.json', 'w') as json_file:
        json.dump(course_information, json_file)


# input course_list and premade dictionary
# try to scrape cross listed from scottylab web-based course tool
# requires the code has dash! in 15-122 format
def add_additional_info(course_list, course_information):
    keyword = "crosslisted"
    for code in course_list:
        try:
            address = f"https://course-tool-backend-2kh6wuzobq-uc.a.run.app/course/{code}?schedules=true"
            r = requests.get(address)
            #print(r.text)
            #print(get_content(r.text, keyword))
            if r.text == "null":
                continue
            #print(get_content(r.text, keyword))
            content = get_content(r.text, keyword)
            if content == []:
                course_information[code][keyword] = None
            else:
                course_information[code][keyword] = get_content(r.text, keyword)
            print(code)
        except:
            print("nope here " + str(code))
    print("all passed")

# a function to parse text and retrieve content from token
# WARNING: don't touch it... plz. it works for no reason so just let it be
def get_content(text, keyword):
    start = text.index(keyword) + 13
    end = start
    while text[end] != "]":
        end += 1
    end += 1
    return eval(text[start: end])

def cleaning():
    for course in course_information:
        if course_information[course]["prereq"] != None:
            course_information[course]["prereq"] = eval(course_information[course]["prereq"])
            # print(course_information[course]["prereq"])
            


test = '{"units":"12.0","crosslisted":["24-633","27-701"],"coreqs":[],"prereqString":"39601 or 27765 or 39602 or 24632 or 27503","prereqs":["39-601","27-765","39-602","24-632","27-503"],"desc":"Hands-on laboratory projects will teach students about all aspects of metals additive manufacturing (AM). Students will learn how to use SOLIDWORKS for part design, create and transfer design files to the AM machines, run the machines to build parts, perform post-processing operations, and characterize AM parts. Student will work in teams and complete three separate lab projects, each utilizing a different material system, part design, AM process/machine, post-processing steps and characterization methods. A major lab report and presentation will be required for each of the three lab projects. The course includes weekly lectures to complement the laboratory component. Priority for enrollment will be given to students who have declared the Additive Manufacturing Minor.","courseID":"39-603","department":"CIT Interdisciplinary","name":"Additive Manufacturing Laboratory:","schedules":[{"_id":"5fb97407f5a3ef0fd12716b1","courseID":"39-603","year":2020,"semester":"spring","lectures":[],"sections":[{"instructors":["Beuth, Jack","DeVincent Wolf, Sandra"],"_id":"6021cdbba46d4637fd7160d9","name":"A","times":[{"days":[1,3],"_id":"6021cdbba46d4637fd7160da","begin":"09:30AM","end":"11:20AM","building":"SH","room":"208"}],"location":"Pittsburgh, Pennsylvania"}]},{"_id":"5fba39e53259b617f1b6f377","courseID":"39-603","year":2021,"semester":"spring","lectures":[],"sections":[{"instructors":["Beuth, Jack","DeVincent Wolf, Sandra"],"_id":"6021e361329f1238c45b43e6","name":"A","times":[{"days":[1,3],"_id":"6021e361329f1238c45b43e7","begin":"09:10AM","end":"11:00AM","building":"TEP","room":"1102"}],"location":"Pittsburgh, Pennsylvania"}]},{"_id":"618f1b378bd73c0c4705b15a","courseID":"39-603","year":2022,"semester":"spring","lectures":[],"sections":[{"instructors":["Beuth, Jack"],"_id":"618f1b378bd73c0c4705b15b","name":"A","times":[{"days":[1,3],"_id":"618f1b378bd73c0c4705b15c","begin":"10:10AM","end":"12:00PM","building":"PH","room":"A19C"}],"location":"Pittsburgh, Pennsylvania"}],"__v":0},{"_id":"6358ac06e0c88b7b5f661683","courseID":"39-603","year":2023,"semester":"spring","lectures":[],"sections":[{"times":[{"days":[1,3],"begin":"10:00AM","end":"11:50AM","building":"WEH","room":"6403","_id":"6358ac06e0c88b7b5f661685"}],"name":"A","instructors":["Beuth, Jack"],"location":"Pittsburgh, Pennsylvania","_id":"6358ac06e0c88b7b5f661684"}],"__v":0}],"id":null}'
def main():
    load_data(rescrape = False)
    #add_additional_info(get_course_code(r_coursecatalog.text, dash = True), course_information)
    #get_content(test, "crosslisted")
    cleaning()
    load_to_json()
    
    return 42

main()

