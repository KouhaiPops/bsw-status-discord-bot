pipeline {
    agent any
    stages {
        stage('build') {
            steps {
                sh 'npm install'
            }
        }
        stage('build-deploy') {
            steps {
                sh 'bash build.sh'
            }
        }
    }
}