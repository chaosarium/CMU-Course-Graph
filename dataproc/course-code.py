import re
import requests

course_catalog = "https://enr-apps.as.cmu.edu/assets/SOC/sched_layout_spring.htm"
r_courselist = requests.get(course_catalog)


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

# input html with tags removed
# return a list of course codes
# example: [15112, 15122, 80285, 80180]
def get_course_code(text):
    course_list = []
    tokens = text.split("#")
    #print(tokens)
    for token in tokens:
        obj = re.match(r"^\d{5}$", token)
        if obj != None:
            course_list.append(obj.group())
    return course_list


course_list = get_course_code(remove_tags(r_courselist.text))
