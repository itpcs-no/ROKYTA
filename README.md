ROKYTA – export projektu

Obsah:
- ROKYTA/dist: kompletná webová prehliadka, JavaScript, modely, textúry a pôdorysy.
- ROKYTA/source: pomocné skripty na prípravu údajov. Niektoré vyžadujú pôvodné vstupné výkresy a úpravu ciest.
- Rokyta-historia.bundle: samostatná záloha celej histórie aktuálnej vetvy (39 commitov).

NAHRATIE CEZ GITHUB DESKTOP
1. Rozbaľ ZIP.
2. V GitHub Desktop otvor svoj repozitár Rokyta a klikni Show in Explorer.
3. Do tohto priečinka skopíruj OBSAH priečinka ROKYTA z exportu (dist, source, README.md a .gitignore).
4. V GitHub Desktop sa zobrazia zmeny. Do Summary napíš Import projektu Rokyta a klikni Commit to main.
5. Publish repository vytvára nový repozitár. Ak už itpcs-no/ROKYTA existuje, naklonuj ho cez File > Clone repository > URL do iného prázdneho priečinka a skopíruj obsah ROKYTA tam; potom Commit to main a Push origin.

SPUSTENIE NA POČÍTAČI
S nainštalovaným Pythonom otvor terminál v priečinku ROKYTA a spusti:
  python -m http.server 8000 --directory dist
Potom otvor http://localhost:8000 v prehliadači.
index.html neotváraj dvojklikom: aplikácia používa JavaScript moduly a načítavanie súborov cez HTTP.

ZACHOVANIE HISTÓRIE (voliteľné, pre používateľa Gitu)
Bundle nekopíruj do webového projektu. V priečinku s bundle spusti:
  git clone -b HEAD Rokyta-historia.bundle Rokyta-s-historiou
  cd Rokyta-s-historiou
  git branch -M main
  git remote set-url origin https://github.com/itpcs-no/ROKYTA.git
  git push -u origin main
Posledný príkaz je určený pre prázdny cieľový repozitár. Nepoužívaj force push pri existujúcej histórii.

Export zachytáva commit c176fd4 (zariadenie obytných podlaží podľa pôdorysov).
Zdrojové licenčné poznámky k použitým knižniciam, vozidlám a materiálom zostali zachované v dist/assets.
Export ani push do GitHubu nemení existujúcu publikovanú prehliadku; automatické nasadzovanie treba nastaviť osobitne.
