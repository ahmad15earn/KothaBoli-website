; ============================================================
; KothaBoli - Professional Windows Installer (Inno Setup 6)
; Output: dist\Output\KothaBoli-Setup.exe
; Next-Next-Finish style: welcome -> folder choice -> install
; ============================================================

#define MyAppName "KothaBoli"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "KothaBoli"
#define MyAppURL "https://kothaboli.app"
#define MyAppExeName "KothaBoli.exe"

[Setup]
; Unique app ID (do not change between versions!)
AppId={{4E7A2C91-8B5F-4F3E-91A3-2C7D6BA5F0E1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
; Full version metadata - helps Windows trust & file properties dialog
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} - Bangla & English voice typing for Windows
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoVersion={#MyAppVersion}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=assets\LICENSE.txt
SetupIconFile=assets\logo.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
OutputDir=dist\Output
OutputBaseFilename=KothaBoli-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
UninstallDisplayName={#MyAppName} (Bangla & English Voice Typing)
MinVersion=10.0
; 64-bit install: go to real "Program Files", not (x86)
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "dist\KothaBoli\KothaBoli.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\KothaBoli\_internal\*"; DestDir: "{app}\_internal"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch KothaBoli"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /IM KothaBoli.exe /F"; Flags: runhidden; RunOnceId: "KillApp"

[UninstallDelete]
; leave %APPDATA%\KothaBoli (user settings/history) untouched - intentional
