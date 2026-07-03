# Electro

**First things first**:
Clone the repository.

```git
git clone "https:github.com/DevBinaries/Electro.git"
```

### Project Runtime Environments
* Node js
* Python 

### Version Control
* Git
* GitHub

#### Installing Backend  Dependencies

```create virtual environment```
python -m venv "name of environment"

```start virtual environment```
*Linux - source environmentName/bin/activate
*Windows - environmentName\Scripts\activate


```change into backend directory```
cd core 

```install dependencies```
pip install -r requirements.txt

#### Start backend
```migrate models to db```
python manage.py makemigrations

python manage.py migrate

```create superuser (admin)```
python manage.py createsuperuser

```start backend server locally```
python manage.py runserver

```Login into Django Admin Dashboard and set role for superuser to admin```
http://127.0.0.1:8000/admin/


####
SETUP AND START FRONTEND
```cd into Frontend```

````install react packages && dependencies````
npm install 

```` Start project````
npm run dev

#### Project Directions ####

```User Creation & Management```
All users are created by superuser (Admin) via the admin dashboard.
Each user is given a role 

--Superuser / Admin ---
Manages the entire system.
1. Creates and manages users
2. Creates Election snapshots
3. Assigns Electoral officer & Auditors to an election snapshot
4. Monitors closely malicious activities (Fraud, System attacks)

--ELectoral Officer ---
*Responsible for managing election snapshot:
1. Creating Positions
2. Adding candidate to each position category
3. Adding voters for that elections via CSV/Excel file
4. Lock election after everything has been configured and confirmed
5. Start and end elections in due time


--Auditor---
*Responsible for tracking and checking location for malicious activities
1. They are responsible for generating reports on elections.
2. Monitor logs on an election


```Election Life Cycle```
1. Admin creates election snapshot, assigns Electoral Officer & Auditors to an election
2. Electoral officer configures and confirms election informations.
3. Electoral officer adds Positions & Candidates for the elections
4. Electoral Officer imports voters for the elections and then locks the election
5. Electoral officer manually starts the election for voters to cast their votes. Link for election is shared for both voters to cast their voters and observers link to view the live results in real time
6. After election the election is closed and results are accumulated
7. Election snapshot is archived after auditing. 
