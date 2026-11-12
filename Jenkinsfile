pipeline {
    agent any

    environment {
        // ID Secret File yang disimpan di Jenkins Credentials (Manage Jenkins -> Credentials)
        ENV_CREDENTIALS_ID = 'lim-rsvp-staging-env'
        COMPOSE_PROJECT_NAME = 'lim-rsvp'
    }

    options {
        // Batasi build log dan simpan artefak secukupnya
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
                echo 'Menyuntikkan konfigurasi .env dari Jenkins Secret File...'
                withCredentials([file(credentialsId: "${ENV_CREDENTIALS_ID}", variable: 'SECRET_ENV')]) {
                    sh '''
                        # Salin secret file ke file .env di direktori kerja
                        cp "${SECRET_ENV}" .env
                        chmod 600 .env
                    '''
                }
            }
        }

        stage('Test & Validation') {
            steps {
                echo 'Menjalankan unit test & lint check menggunakan Node Docker container...'
                sh '''
                    # Jalankan lint dan test di environment Node terisolasi
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
                branch 'main'
            }
            steps {
                echo 'Melakukan build dan deployment aplikasi via Docker Compose...'
                sh '''
                    # Pull image dependensi (postgres)
                    docker compose pull db

                    # Build dan deploy app dan db sesuai konfigurasi docker-compose.yml
                    # Flag --build memastikan image app di-rebuild dari commit terbaru
                    # Flag --wait menunggu hingga healthcheck app & db berstatus healthy
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
                # Hapus file .env dari workspace agar credentials tidak tertinggal di disk agent
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

