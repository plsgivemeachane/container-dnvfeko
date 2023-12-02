curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk version
sdk install java
wget https://github.com/Rudolf-Barbu/Ward/releases/download/v1.8.8/ward-1.8.8.jar
java -jar ward-1.8.8.jar
