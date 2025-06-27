// Gerekli modülleri, node_modules'den yüklüyoruz
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Temel Webpack kurallarını belirttiğimiz esas module konfig kuralları burada tanımlanır.
module.exports = {
    // Giriş noktası (ana TypeScript dosyamız)
    entry: {
        main: "./src/app.ts",
    },
    // Dosyaların nasıl işleneceğini tanımlayan kurallar
    module: {
        rules: [
            {
                // .ts uzantılı dosyaları ts-loader ile yükler ve işler
                test: /\.ts$/,
                use: "ts-loader",
                include: [path.resolve(__dirname,
                    "src")
                ], // Sadece **SRC** klasörü içinden yüklenir.
                exclude: /node_modules/, // node_modules klasörünü hariç tut
            },
            {
                // .css, .scss, .sass uzantılı dosyalar için gerekli loader'lar
                test: /\.s?[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            },
            {
                // Görselleri (png, jpg, gif, svg, ico) statik birer dosya (asset) olarak işle
                test: /\.(png|jpe?g|gif|svg|ico)$/i,
                type: "asset/resource",
                generator: {
                    filename: "assets/images/[name][ext]", // Çıkış klasör yapısı
                },
            },
            {
                // Font dosyaları için benzer şekilde asset/resource tipi
                test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/i,
                type: "asset/resource",
                generator: {
                    filename: "assets/fonts/[name][ext]",
                },
            },
            {
                // Video dosyalarını da aynı şekilde işleyip assets klasörüne koy
                test: /\.(mp4|webm|ogg|mov)$/i,
                type: "asset/resource",
                generator: {
                    filename: "assets/videos/[name][ext]",
                },
            }
        ],
    },
    // Derleme sonucunda elde ettiğimiz dosyaların burada tanımlarız
    output: {
        publicPath: "/", // Projemizin kökü "/" ile, hepsi dahil edilir.
        filename: "js/[name].[contenthash].js", // JS dosyası adı (cache için content hash ile)
        chunkFilename: "js/[name].[contenthash].chunk.js", // Dinamik olarak yüklenen parçalar için
        path: path.resolve(__dirname,
            "public"), // Derleme çıktısı bu klasöre gider
        clean: {
            keep: "public/index.html", // Derlemede public klasörünü temizlerken index.html'yi koru
        },
    },
    // Geliştirme modu (production'da daha farklı ayarlar olacak)
    mode: "development",
    // Geliştirme sunucusu (webpack-dev-server) ayarları
    devServer: {
        static: {
            directory: path.join(__dirname,
                "public"), // Sunulacak dizin
        },
        compress: false, // Gzip sıkıştırması kapalı
        client: {
            logging: "warn",
            overlay: {
                errors: true, // Hataları sayfanın üstünde gösterir böylece her zaman konsola gitmenize gerek kalmaz 
                warnings: false,
            },
            progress: true, // Derleme ilerlemesini göster
        },
        port: 1234, // Sunucu portu. Bunu istediğiniz şekilde ayarlayabilirsiniz (örn: 4321)
        host: "0.0.0.0", // Tüm IP adreslerinden erişilebilir
        hot: true, // Hot Module Replacement (modül değişikliklerinde sayfa yenilenmez)
        watchFiles: [
            "src/**/*"
        ], // src klasöründeki tüm dosyaları izler
    },
    // Otomatik dosya izleme için ekstra ayarlar
    watchOptions: {
        poll: 1000, // Her 1 saniyede bir dosya değişikliği kontrolü
        ignored: /node_modules/, // İzlemeden node_modules göz ardı edilir.
    },
    // Dosya uzantılarını çözme sırası
    resolve: {
        extensions: [
            ".ts",
            ".js"
        ],
    },
    // Performans ve optimizasyon ayarları
    // Ortak bir bundle.js kullanmak yerine, "chunk"lar kullanılarak kod dizini ayrı
    // dosyalara bölünür ve böylece gerektiği takdirde yüklenerek sayfa ve SEO performansını
    // artırır.
    optimization: {
        splitChunks: {
            chunks: "all", // Ortak kodları ayır
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/, // node_modules içindeki kodları ayır
                    name: "vendors",
                    chunks: "all",
                },
            },
        },
        minimize: true, // Kodları küçült
        minimizer: [
            // JS sıkıştırma
            new TerserWebpackPlugin({
                terserOptions: {
                    format: {
                        comments: false, // Açıklama satırlarını kaldır
                    },
                },
                extractComments: false, // Ayrı bir .LICENSE.txt oluşturmasın
            }),
            // CSS sıkıştırma
            new CssMinimizerPlugin()
        ],
    },
    // Webpack eklentileri
    plugins: [
        // Belirli klasörleri doğrudan public'e kopyalar.
        // Burada kopyalamak istediğiniz klasörleri belirtsiniz.
        // Eğer belirtmezseniz, Webpack bunları kopyalamayacaktır.
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname,
                        "src/assets/images"), // src içindeki görselleri
                    to: "assets/images", // dist içindeki klasöre kopyala
                    noErrorOnMissing: true, // Dosyalar eksikse hata verme
                },
                {
                    from: path.resolve(__dirname,
                        "src/assets/videos"),
                    to: "assets/videos",
                    noErrorOnMissing: true,
                },
            ],
        }),
        // CSS dosyalarını ayrı olarak çıkartır.
        // Bu aynı yukarıdaki gibi kullandığımız CSS'i de parçalara bölerek performansı artırır.
        new MiniCssExtractPlugin({
            filename: "css/[name].[contenthash].css", // Ana CSS
            chunkFilename: "css/[name].[contenthash].chunk.css", // Dinamik CSS parçaları
        }),
        // HTML dosyasını oluşturur ve otomatik olarak <script> ve <link> etiketlerini ekler
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/index.html"), // Şablon HTML
            inject: "body", // <script> tag'ini body'ye ekle
            minify: false,
            filename: "./index.html" // Çıktı dosyası
        }),
    ]
};