import string
import httplib2
from googleapiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials
from google.oauth2.credentials import Credentials
from datetime import datetime
import enum
import os

class PageNames(enum.Enum):

    uniqueMessage = "УникальныеСообщения"

pages = PageNames

CREDENTIALS_FILE = '../credentials.json'

credentials = ServiceAccountCredentials.from_json_keyfile_name(
    CREDENTIALS_FILE,
    ['https://www.googleapis.com/auth/spreadsheets',
     'https://www.googleapis.com/auth/drive']
)
httpAuth = credentials.authorize(httplib2.Http())

service = build('sheets', 'v4', http=httpAuth)
service_drive = build('drive', 'v3', http=httpAuth)

spreadsheet_id = os.environ.get('GOOGLE_SPREADSHEET_ID')

def getTableModifiedTime():
    response = service_drive.files().get(
        fileId=spreadsheet_id, fields="modifiedTime").execute()
    modified_time_str = response['modifiedTime']
    date = datetime.fromisoformat(modified_time_str[:-1])
    return date


def getContent(page: PageNames, range: string) -> [[str]]:
    if type(page) == PageNames:
        pageName = page.value
    else:
        pageName = page
    values = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=f'{pageName}!{range}',
        majorDimension='ROWS'
    ).execute()

    values = values['values']
    return values