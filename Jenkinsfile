pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'lim-rsvp'
        // Credential ID di Jenkins Credentials (Secret file)
        PROD_ENV_CREDENTIALS_ID    = 'lim-rsvp-prod-env'
        STAGING_ENV_CREDENTIALS_ID = 'lim-rsvp-staging-env'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Inject Environment (.env)') {
            steps {
                script {
                    // Deteksi nama branch (mendukung Multibranch Pipeline maupun Pipeline biasa)
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                    echo "Mendeteksi branch aktif: ${currentBranch}"

                    def secretId = ''
                    if (currentBranch.contains('main')) {
                        echo "Environment terdeteksi: STAGING"
                        secretId = env.STAGING_ENV_CREDENTIALS_ID
                    } else {
                        echo "Environment terdeteksi: PRODUCTION (production)"
                        secretId = env.PROD_ENV_CREDENTIALS_ID
                    }

                    echo "Mengambil credential secret file ID: ${secretId}"
                    withCredentials([file(credentialsId: secretId, variable: 'SECRET_ENV')]) {
                        sh '''
                            cp "${SECRET_ENV}" .env
                            chmod 600 .env
                        '''
                    }
                }
            }
        }

        stage('Test & Validation') {
            steps {
                echo 'Menjalankan unit test & lint check menggunakan Node Docker container...'
                sh '''
                    docker run --rm \
                        -v "${WORKSPACE}":/app \
                        -w /app \
                        node:22-alpine \
                        sh -c "npm ci && npm run lint && npm run test"
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    expression {
                        def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: ''
                        return currentBranch.contains('main') || currentBranch.contains('staging')
                    }
                }
            }
            steps {
                echo 'Melakukan build dan deployment aplikasi via Docker Compose...'
                sh '''
                    # Pull image dependensi (postgres)
                    docker compose pull db

                    # Build dan deploy app dan db sesuai konfigurasi docker-compose.yml
                    docker compose up -d --build --wait --remove-orphans

                    # Verifikasi status container
                    docker compose ps
                '''
            }
        }
    }

    post {
        always {
            echo 'Membersihkan file sensitif dari workspace Jenkins...'
            sh '''
                rm -f .env
            '''
        }
        success {
            echo 'Pipeline CI/CD berhasil diselesaikan!'
        }
        failure {
            echo 'Pipeline CI/CD gagal. Menampilkan log container untuk debugging...'
            sh 'docker compose logs --tail=50 app || true'
        }
        cleanup {
            // Bersihkan dangling Docker images agar kapasitas disk server tetap terjaga
            sh 'docker image prune -f || true'
        }
    }
}
