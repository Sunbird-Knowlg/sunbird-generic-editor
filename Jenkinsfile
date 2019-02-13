node() {
    try {
        String ANSI_GREEN = "\u001B[32m"
        String ANSI_NORMAL = "\u001B[0m"
        String ANSI_BOLD = "\u001B[1m"
        String ANSI_RED = "\u001B[31m"
        String ANSI_YELLOW = "\u001B[33m"
        
        ansiColor('xterm') {
            stage('Checkout') {
                cleanWs()
                sh "git clone https://github.com/project-sunbird/sunbird-content-plugins plugins
                if (params.github_release_tag == "") {
                    checkout scm
                    commit_hash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    branch_name = sh(script: 'git name-rev --name-only HEAD | rev | cut -d "/" -f1| rev', returnStdout: true).trim()
                    build_tag = branch_name + "_" + commit_hash
                    println(ANSI_BOLD + ANSI_YELLOW + "github_release_tag not specified, using the latest commit hash: " + commit_hash + ANSI_NORMAL)
                    sh "cd plugins && git checkout origin/${branch_name} -b ${branch_name}"
                } else {
                    def scmVars = checkout scm
                    checkout scm: [$class: 'GitSCM', branches: [[name: "refs/tags/${params.tag}"]], userRemoteConfigs: [[url: scmVars.GIT_URL]]]
                    build_tag = params.github_release_tag
                    println(ANSI_BOLD + ANSI_YELLOW + "Tag specified, building from tag: " + params.github_release_tag + ANSI_NORMAL)
                    sh "cd plugins && git checkout tags/${params.tag} -b ${params.tag}"
                }
                echo "artifact_version: "+ artifact_version
            }
        }

        stage('Build') {
            sh """
                        rm -rf generic-editor
                        node -v
                        npm -v
                        
                        npm install
                        cd app
                        bower cache clean
                        bower install --force
                        cd ..
                        
                        version_number = 
                        build_number = 
                        
                        gulp packageCorePlugins
                        npm run plugin-build
                        npm run build
                        #gulp build
                        npm run test
                        
                 """    
        }

        stage('Archive artifacts'){
            sh """
                        mkdir generic_editor_artifacts
                        cp generic-editor.zip generic_editor_artifacts
                        zip -j generic_editor_artifacts.zip:${artifact_version} generic_editor_artifacts/*
                    """
            archiveArtifacts artifacts: "generic_editor_artifacts.zip:${artifact_version}", fingerprint: true, onlyIfSuccessful: true
            sh """echo {\\"artifact_name\\" : \\"lp_yarn_artifacts.zip\\", \\"artifact_version\\" : \\"${artifact_version}\\", \\"node_name\\" : \\"${env.NODE_NAME}\\"} > metadata.json"""
            archiveArtifacts artifacts: 'metadata.json', onlyIfSuccessful: true
            currentBuild.description = "${artifact_version}"
        }
    }

    catch (err) {
        currentBuild.result = "FAILURE"
        throw err
    }

}
