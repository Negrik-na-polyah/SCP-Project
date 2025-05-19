@echo off
cd "c:\Users\admin\Documents\Grishin Fimoz\SCP-Project"
git init
git add .
git commit -m "Update SCP game project with new features"
git remote add origin https://github.com/username/SCP-Project.git
git push -u origin master
pause
