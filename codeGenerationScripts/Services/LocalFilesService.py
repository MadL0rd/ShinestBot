import platform
from pathlib import Path
import json
from typing import List, Dict

isWindows = platform.system() == 'Windows'

class LocalFilesService(object):

    baseFolder: Path

    def __init__(self, baseFolder: Path) -> None:
        self.baseFolder = baseFolder
        if not baseFolder.exists():
            baseFolder.mkdir(parents=True, exist_ok=True)

    def getJson(self, filePath: Path):
        with filePath.open() as jsonFile:
            data = json.load(jsonFile)
        return data

    def writeJson(self, filePath: Path, content):
        if isWindows:
            data = json.dumps(content, indent=2)
            with filePath.open('w', encoding='utf-8') as file:
                file.write(data)
        else:
            data = json.dumps(content, ensure_ascii=False, indent=2)
            with filePath.open('w') as file:
                file.write(data)

    def appendLineToFile(self, filePath: Path, text: str):
        with filePath.open('a') as file:
            file.write(f'\n{text}')

    def makeFoldersForIosLocalization(self, baseFolder: Path, languages: List[str]) -> Dict[str, Path]:
        self.removeFilderWithFiles(baseFolder)
        baseFolder.mkdir(parents=True, exist_ok=True)
        
        foldersMap: Dict[str, Path] = {}
        for language in languages:
            folder = baseFolder / f'{language.lower()}.lproj'
            folder.mkdir(parents=True, exist_ok=True)
            foldersMap[language] = folder
        
        return foldersMap

    def removeFilderWithFiles(self, path: Path):
        if not path.exists():
            return
        
        for item in path.iterdir():
            if item.is_dir():
                self.removeFilderWithFiles(item)
            else:
                item.unlink()
        path.rmdir()