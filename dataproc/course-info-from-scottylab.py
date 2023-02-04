import cmu_course_api
import json
import re
import requests


course_catalog_link_spring = "https://enr-apps.as.cmu.edu/assets/SOC/sched_layout_spring.htm"
course_catalog_link_fall = "https://enr-apps.as.cmu.edu/assets/SOC/sched_layout_fall.htm"
r_coursecatalog_spring = requests.get(course_catalog_link_spring)
r_coursecatalog_fall = requests.get(course_catalog_link_fall)
SOURCE_FILE_NAME = "academic-year-full.txt"
TARGET_FILE_NAME = "academic-year-full_list.json"
sample_list = ["15-122", "15-112", "80-285", "21-127", "80-100"]
course_information = {}
course_list = []



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

# it's too 'precise', don't touch
def add_dash(s):
    return s[:2] + "-" + s[2:]

# input list of corse codes (should work with/without dash)
# also input data from scottylab api
# export to SOURCE_FILE_NAME, overwrite if file exists
def write_data_to_file(course_list, data):
    f = open(SOURCE_FILE_NAME, "w")
    #g = open("raw-data.txt", "w")
    keywords = {"prereqs_obj": "prereq", "coreqs_obj": "coreq"}
    for course_key in course_list:
        #g.write(repr(data["courses"][course_key]))
        #g.write("\n")
        if course_key.count("-") == 0:
            course_key = add_dash(course_key)
        course_info = ['\n']
        course_info.append("key:" + course_key)
        course_info.append("name:" + data[course_key]["name"])
        course_info.append("units:" + str(data[course_key]["units"]))
        if data[course_key]["desc"] != None:
            course_info.append("desc:" + data[course_key]["desc"])
        else:
            course_info.append("desc:" + "None")
        for keyword in keywords:
            if data[course_key][keyword]["reqs_list"] != None:
                course_info.append(keywords[keyword] + ":" + ",".join(str(entry) for entry in data[course_key][keyword]["reqs_list"]))
            else:
                course_info.append(keywords[keyword] + ":" + "None")
        f.write("\n".join(course_info))
    f.close()

# read from SOURCE_FILE_NAME
# construct a dictionary of courses ---> for json export
# for each course, all features are initialized to [] to avoid null pointer XD
# update content by eval! note! very problem-prone
# WARNING! may cause problem here ---> "if ~(content[0] == "[" and content[-1] == "]"):"
def read_data_from_file():
    global course_information
    f = open(SOURCE_FILE_NAME, "r")
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
                course_information[current_course]["name"] = []
                course_information[current_course]["units"] = []
                course_information[current_course]["desc"] = []
                course_information[current_course]["antireq"] = []
                course_information[current_course]["min-grade"] = []
                # course_information[current_course]["crosslisted"] = []
                course_information[current_course]["prereq"] = []
                course_information[current_course]["coreq"] = []
            else:
                if ~(content[0] == "[" and content[-1] == "]"):
                    if content == "None":
                        course_information[current_course][keyword] = []    
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
        # get data from scottylab
            data = cmu_course_api.get_course_data("S")["courses"] | cmu_course_api.get_course_data("F")["courses"]
            print(len(data))
            write_data_to_file(course_list, data)

    course_list_fall = get_course_code(r_coursecatalog_fall.text, dash = dash) 
    course_list_spring = get_course_code(r_coursecatalog_spring.text, dash = dash) 
    course_list = list(set(course_list_fall) | set(course_list_spring))
    print(len(course_list_fall))
    print(len(course_list_spring))
    print(len(course_list))
        # export to local file, in gorgeous format, you are welcome :)
    # load into Python dictionary
    read_data_from_file()
    return course_list

# expoort to a json file
# file name is TARGET_FILE_NAME
def load_to_json():
    # export to json file
    with open(TARGET_FILE_NAME, 'w') as json_file:
        json.dump(course_information, json_file)

# input course_list and premade dictionary
# try to scrape cross listed from scottylab web-based course tool
# requires the code has dash! in 15-122 format
def add_additional_info(course_list):
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
                course_information[code][keyword] = []
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

def need_modify(prereqs):
    flag = True
    for item in prereqs:
        if isinstance(item, list):
            flag = False
    return flag

def cleaning():
    for course in course_information:
        if course_information[course]["prereq"] != []:
            prereqs = eval(course_information[course]["prereq"])
            if need_modify(prereqs):
                print(prereqs)
                course_information[course]["prereq"] = [prereqs]
            else:
                course_information[course]["prereq"] = prereqs
        if course_information[course]["coreq"] != []:
            course_information[course]["coreq"] = eval(course_information[course]["coreq"])
            # print(course_information[course]["prereq"])
            

def it_does_fixing():
    # add crosslisted to course-informatfull_list with string 9am.jsonion
    with open("academic-year-full_list copy 2.json", "r") as read_file:
        print("Converting JSON encoded data into Python dictionary")
        dict_with_cross = json.load(read_file)
    for key in course_information:
        try:
            content = dict_with_cross[key]["crosslisted"]
        except:
            print(key)
            dict_with_cross[key]["crosslisted"] = []
            content = []
        if content == None:
            course_information[key]["crosslisted"] = []
        else:
            course_information[key]["crosslisted"] = content
            
def main():

    
    course_list = load_data(rescrape = False)
    # add_additional_info(course_list)
    it_does_fixing()
    cleaning()
    load_to_json()
    
    
    #courses_from_catalog = get_course_code(r_coursecatalog.text, dash = True)
    #with open("full_list.json", "r") as read_file:
    #    print("Converting JSON encoded data into Python dictionary")
    #    course_information_from_scottylab = json.load(read_file)
    #print("21-128" in course_information_from_scottylab)
    #print("21-128" in courses_from_catalog)
    #for code in courses_from_catalog:
    #    if code not in course_information_from_scottylab:
    #        print(f"scottylab is missing {code}")


    print("finished")    
    return 42

main()

