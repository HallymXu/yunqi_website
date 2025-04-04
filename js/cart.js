class CartManager {
    constructor() {
        this.services = null;
        this.cartDetails = {
            questions: [],
            diagnoses: [],
            package: [],
            addons: [],
            discount: 0
        };
        this.loadingElement = document.getElementById('loading');
        this.permissionLevel = null;
        this.maxDiscount = 0;
        this.userName = '';
        
        // 清除本地存储的用户数据
        localStorage.removeItem('userName');
        localStorage.removeItem('cartDetails');
        
        this.init();
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    async init() {
        this.showLoading();
        try {
            const response = await fetch('data/unified_services.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.services = await response.json();
            this.renderServices();
            this.renderContactInfo();
            this.renderFooter();
            this.setupEventListeners();
            
            // 清除优惠金额
            this.cartDetails.discount = 0;
            const discountInput = document.getElementById('discountInput');
            if (discountInput) {
                discountInput.value = '0';
            }
            
            this.loadCartFromLocalStorage();
            // Show shop section by default
            this.showSection('shop');
        } catch (error) {
            console.error('Error loading services:', error);
            alert('加载服务数据时出错，请刷新页面重试。');
        } finally {
            this.hideLoading();
        }
    }

    renderServices() {
        this.renderQASection();
        this.renderMainPackages();
        this.renderDiyServices();
        this.renderAddOns();
    }

    renderQASection() {
        const qaSection = document.getElementById('qa');
        if (!qaSection || !this.services) return;
        
        qaSection.innerHTML = '<h2>咨询服务</h2>';
        
        // Create service categories container
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'service-categories';
        
        // Render each category
        const categories = [
            { title: '基础套餐', services: this.services['basicPackages'] },
            { title: 'DIY答疑', services: this.services['diyQA'] },
            { title: 'DIY诊断', services: this.services['diyDiagnosis'] },
            { title: '增值选项', services: this.services['addOns'] }
        ];
        
        categories.forEach(category => {
            if (category.services && category.services.length > 0) {
                categoriesContainer.appendChild(this.createCategory(category.title, category.services));
            }
        });
        
        qaSection.appendChild(categoriesContainer);
    }

    createCategory(title, services) {
        const category = document.createElement('div');
        category.className = 'category';
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        category.appendChild(titleElement);
        
        const serviceGrid = document.createElement('div');
        serviceGrid.className = 'service-grid';
        
        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            
            serviceCard.onclick = () => this.showServiceDetails(service);
            
            serviceCard.innerHTML = `
                <h4>${service['name']}</h4>
                <p class="target">适合：${service['targetAudience']}</p>
                <p class="pain-point">解决：${service['customerPain']}</p>
                <p class="highlight">亮点：${service['serviceHighlight']}</p>
                <p class="view-details">点击查看详情</p>
            `;
            
            serviceGrid.appendChild(serviceCard);
        });
        
        category.appendChild(serviceGrid);
        return category;
    }

    renderContactInfo() {
        const contactInfo = this.services['websiteInfo']['contactInfo'];
        const contactContainer = document.querySelector('.contact-info');
        if (!contactContainer) return;

        contactContainer.innerHTML = `
            <div class="contact-item" style="flex: 1; text-align: center; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                <h3>微信</h3>
                <p>微信号：<span class="highlight">${contactInfo['wechat']['account']}</span></p>
                <div class="qr-code"><img src="${contactInfo['wechat']['qrcode']}" alt="微信二维码"></div>
            </div>
            <div class="contact-item" style="flex: 1; text-align: center; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                <h3>合作微信</h3>
                <p>微信号：<span class="highlight">${contactInfo['wechat_cooperation']['account']}</span></p>
                <div class="qr-code"><img src="${contactInfo['wechat_cooperation']['qrcode']}" alt="合作微信二维码"></div>
            </div>
            <div class="contact-item" style="flex: 1; text-align: center; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;">
                <h3>联系邮箱</h3>
                <div>
                    <p style="color: #666;">
                        工作时间：<br>
                        ${contactInfo['email']['workingHours']}
                    </p>
                    <p style="margin: 15px 0;">
                        <span class="highlight">${contactInfo['email']['address']}</span>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        邮件回复时间：${contactInfo['email']['responseTime']}<br>
                        ${contactInfo['email']['urgentConsultation']}
                    </p>
                    <p style="color: #27ae60; font-size: 13px; margin-top: 10px;">
                        ✓ 专业解答 | ✓ 快速响应 | ✓ 一对一服务
                    </p>
                </div>
            </div>

        `;
    }
//     <div class="contact-item" style="flex: 1; text-align: center; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
//     <h3>咨询群</h3>
//     <p>扫描下方二维码加入咨询群</p>
//     <div class="qr-code"><img src="${contactInfo['consultationGroup']['qrcode']}" alt="微信二维码"></div>
// </div>

    renderFooter() {
        const footer = document.querySelector('footer');
        if (!footer || !this.services) return;

        const copyrightInfo = this.services['websiteInfo']['copyrightInfo'];
        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-copyright">
                    <p>© ${copyrightInfo['year']} ${copyrightInfo['name']} ${copyrightInfo['description']}</p>
                </div>
            </div>
        `;
    }

    renderMainPackages() {
        const tableBody = document.querySelector('table tbody');
        if (!tableBody) return;

        // 清空现有内容
        tableBody.innerHTML = '';

        // 添加套餐名称行
        const headerRow = document.createElement('tr');
        headerRow.className = 'package-header';
        headerRow.innerHTML = '<td class="feature-cell"><strong>套餐特性</strong></td>';
        Object.values(this.services['basicPackages']).forEach(pkg => {
            headerRow.innerHTML += `<td class="package-name-cell"><strong>${pkg['name']}</strong></td>`;
        });
        tableBody.appendChild(headerRow);

        // 获取所有唯一特性
        const allFeatures = new Set();
        Object.values(this.services['basicPackages']).forEach(pkg => {
            pkg.features.forEach(feature => allFeatures.add(feature));
        });

        // 为每个特性创建行
        allFeatures.forEach(feature => {
            const row = document.createElement('tr');
            row.className = 'feature-row';
            row.innerHTML = `<td class="feature-cell">${feature}</td>`;
            
            // 为每个套餐添加单元格
            Object.values(this.services['basicPackages']).forEach(pkg => {
                const cell = document.createElement('td');
                cell.className = 'feature-check-cell';
                cell.innerHTML = pkg.features.includes(feature) ? '<i class="fas fa-check text-success"></i>' : '';
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });

        // 添加价格行
        const priceRow = document.createElement('tr');
        priceRow.className = 'price-row';
        priceRow.innerHTML = '<td class="feature-cell"><strong>参考价格</strong></td>';
        Object.values(this.services['basicPackages']).forEach(pkg => {
            priceRow.innerHTML += `<td class="price-cell"><strong>${pkg['price']}</strong></td>`;
        });
        tableBody.appendChild(priceRow);
    }

    renderDiyServices() {
        // 渲染套餐选项 - 简化显示
        const packageContainer = document.getElementById('package-container');
        if (packageContainer) {
            const packages = this.services['basicPackages'] || [];
            packageContainer.innerHTML = packages.map(pkg => `
                <label class="card-option">
                    <input type="checkbox" name="package" value="${pkg['name']}|${pkg['price']}">
                    <div class="service-info">
                        <strong>${pkg['name']}</strong>
                        <span class="price-display">${pkg['price']}</span>
                    </div>
                </label>
            `).join('');
        }

        // Render DIY Questions - 简化显示
        const questionsContainer = document.getElementById('diy-questions-container');
        if (questionsContainer) {
            const questions = this.services['diyQA'] || [];
            questionsContainer.innerHTML = questions.map(service => `
                <label class="card-option">
                    <input type="checkbox" name="diy_question" value="${service['name']}|${service['price']}">
                    <div class="service-info">
                        <strong>${service['name']}</strong>
                        <span class="price-display highlight">${service['price']}</span>
                    </div>
                </label>
            `).join('');
        }

        // Render DIY Diagnosis - 简化显示
        const diagnosisContainer = document.getElementById('diy-diagnosis-container');
        if (diagnosisContainer) {
            const diagnoses = this.services['diyDiagnosis'] || [];
            diagnosisContainer.innerHTML = diagnoses.map(service => `
                <label class="card-option">
                    <input type="checkbox" name="diy_diagnosis" value="${service['name']}|${service['price']}">
                    <div class="service-info">
                        <strong>${service['name']}</strong>
                        <span class="price-display highlight">${service['price']}</span>
                    </div>
                </label>
            `).join('');
        }
    }

    renderAddOns() {
        const addOnsContainer = document.getElementById('addons-container');
        if (addOnsContainer) {
            addOnsContainer.innerHTML = this.services['addOns'].map(addon => `
                <label class="card-option">
                    <input type="checkbox" name="addons" value="${addon['name']}|${addon['price']}">
                    <div class="service-info">
                        <strong>${addon['name']}</strong>
                        <span class="price-display">${addon['price']}</span>
                    </div>
                </label>
            `).join('');
        }
    }

    setupEventListeners() {
        // Add event listeners for package selection
        document.querySelectorAll('input[name="package"]').forEach(input => {
            input.addEventListener('change', () => this.updateCart());
        });

        // Add event listeners for DIY services
        document.querySelectorAll('input[name="diy_question"], input[name="diy_diagnosis"]').forEach(input => {
            input.addEventListener('change', () => this.updateCart());
        });

        // Add event listeners for add-ons
        document.querySelectorAll('input[name="addons"]').forEach(input => {
            input.addEventListener('change', () => this.updateCart());
        });

        // Add event listeners for export buttons
        const customExportBtn = document.getElementById("customExport");
        if (customExportBtn) {
            customExportBtn.addEventListener("click", () => this.renderDetails());
        }

        const downloadImageBtn = document.getElementById("downloadImage");
        if (downloadImageBtn) {
            downloadImageBtn.addEventListener("click", () => this.exportAsImage());
        }

        // Add event listener for clear cart button
        const clearCartBtn = document.getElementById("clearCart");
        if (clearCartBtn) {
            clearCartBtn.addEventListener("click", () => this.clearCart());
        }

        // Add event listener for discount input
        const discountInput = document.getElementById('discountInput');
        if (discountInput) {
            discountInput.addEventListener('change', () => this.updateCart());
        }

        // Add event listener for apply discount button
        const applyDiscountBtn = document.getElementById('applyDiscount');
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', () => this.applyDiscount());
        }

        // Add event listener for service modal close button
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeServiceModal());
        }

        // Add event listener for clicking outside the modal
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('serviceModal');
            if (event.target === modal) {
                this.closeServiceModal();
            }
        });

        // Add event listener for Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeServiceModal();
            }
        });
    }

    // Service Details Modal Functions
    showServiceDetails(service) {
        const modal = document.getElementById('serviceDetailsModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        // 设置标题
        modalTitle.textContent = service.name;
        
        // 构建服务详情内容
        let detailsHtml = '';
        
        // 只添加服务详情（如果存在）
        if (service.serviceDetail) {
            detailsHtml += `
                <div class="service-detail mb-4">
                    <div class="markdown-content">
                        ${this.renderMarkdown(service.serviceDetail)}
                    </div>
                </div>
            `;
        } else {
            detailsHtml += `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>暂无详细内容
                </div>
            `;
        }
        
        // 设置模态框内容
        modalBody.innerHTML = detailsHtml;
        
        // 显示模态框
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // 检查服务是否为基础套餐
    isBasicPackage(service) {
        return this.services['basicPackages'].some(pkg => pkg.name === service.name);
    }

    // 检查服务是否为增值选项
    isAddOn(service) {
        return this.services['addOns'].some(addon => addon.name === service.name);
    }

    // 渲染Markdown内容
    renderMarkdown(markdown) {
        if (!markdown) return '';
        
        // 简单的Markdown渲染
        let html = markdown;
        
        // 处理标题 (## 标题)
        html = html.replace(/##\s+(.*?)(?:\n|$)/g, '<h4 class="mt-4 mb-3">$1</h4>');
        
        // 处理粗体 (**文本**)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 处理列表项 (- 项目)
        html = html.replace(/-\s+(.*?)(?:\n|$)/g, '<li class="mb-2">$1</li>');
        
        // 处理列表组
        html = html.replace(/<li class="mb-2">(.*?)<\/li>/g, (match, content) => {
            return `<ul class="list-unstyled ps-4 mb-3"><li class="mb-2"><i class="fas fa-check text-success me-2"></i>${content}</li></ul>`;
        });
        
        // 处理段落
        html = html.replace(/\n\n/g, '</p><p>');
        
        // 处理换行
        html = html.replace(/\n/g, '<br>');
        
        // 包装在段落标签中
        if (!html.startsWith('<h4') && !html.startsWith('<ul')) {
            html = `<p>${html}</p>`;
        }
        
        return html;
    }

    closeServiceModal() {
        const modal = document.getElementById('serviceModal');
        modal.style.display = 'none';
    }

    checkPermission() {
        const permissionCode = prompt('请输入权限码：');
        if (!permissionCode) return;

        // 简化的权限验证逻辑
        let level = null;
        let maxDiscount = 0;
        let themeColor = '';

        switch(permissionCode) {
            case 'BASIC2024':
                level = 'basic';
                maxDiscount = 2000;
                themeColor = '#2e86de';
                break;
            case 'PREMIUM2024':
                level = 'premium';
                maxDiscount = 5000;
                themeColor = '#6c5ce7';
                break;
            case 'UNLIMITED2024':
                level = 'unlimited';
                maxDiscount = 999999;
                themeColor = '#00b894';
                break;
            default:
                alert('权限码无效！');
                return;
        }

        // 清除之前的权限状态
        this.clearPermissionState();
        
        // 设置新的权限状态
        this.permissionLevel = level;
        this.maxDiscount = maxDiscount;
        this.showPermissionUI(themeColor);
        this.updateCart();
    }

    clearPermissionState() {
        // 清除权限相关的 UI 元素
        const discountContainer = document.querySelector('.discount-input');
        if (discountContainer) {
            discountContainer.classList.remove('active');
            const permissionInfo = discountContainer.querySelector('.permission-info');
            if (permissionInfo) {
                permissionInfo.remove();
            }
        }

        // 重置折扣输入
        const discountInput = document.getElementById('discountInput');
        if (discountInput) {
            discountInput.value = '0';
        }

        // 重置权限状态
        this.permissionLevel = null;
        this.maxDiscount = 0;
        this.cartDetails.discount = 0;
    }

    showPermissionUI(themeColor) {
        const discountContainer = document.querySelector('.discount-input');
        if (!discountContainer) return;

        // 显示折扣输入区域
        discountContainer.classList.add('active');

        // 更新权限显示
        const permissionInfo = document.createElement('div');
        permissionInfo.className = 'permission-info';
        permissionInfo.style.background = `linear-gradient(135deg, ${themeColor} 0%, ${this.adjustColor(themeColor, -20)} 100%)`;
        permissionInfo.innerHTML = `
            <div class="permission-badge">
                <span class="badge-icon">🔑</span>
                <span class="badge-text">${this.getPermissionText()}</span>
            </div>
            <div class="max-discount">最大优惠额度：¥${this.maxDiscount}</div>
        `;

        // 更新折扣输入框
        const discountInput = document.getElementById('discountInput');
        if (discountInput) {
            discountInput.max = this.maxDiscount;
            discountInput.placeholder = `最大优惠 ¥${this.maxDiscount}`;
        }

        // 添加权限信息到容器
        discountContainer.insertBefore(permissionInfo, discountContainer.firstChild);
    }

    adjustColor(color, amount) {
        // 简单的颜色调整函数
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    applyDiscount() {
        const discountInput = document.getElementById('discountInput');
        if (!discountInput) return;

        let discount = this.parsePrice(discountInput.value);
        const maxDiscount = this.parsePrice(this.maxDiscount);

        // 确保折扣不超过最大允许值
        if (maxDiscount > 0) {
            discount = Math.min(discount, maxDiscount);
            discountInput.value = discount;
        }

        // 更新购物车详情中的折扣
        this.cartDetails.discount = discount;
        this.updateCart();
        alert('优惠金额已应用！');
    }

    getPermissionText() {
        switch(this.permissionLevel) {
            case 'basic':
                return '基础权限';
            case 'premium':
                return '高级权限';
            case 'unlimited':
                return '无限权限';
            default:
                return '无权限';
        }
    }

    updateCart() {
        // 获取所有选中的项目
        const selectedPackages = Array.from(document.querySelectorAll('input[name="package"]:checked')).map(input => {
            const [name, price] = input.value.split('|');
            return { name, price: this.parsePrice(price) };
        });

        const selectedQuestions = Array.from(document.querySelectorAll('input[name="diy_question"]:checked')).map(input => {
            const [name, price] = input.value.split('|');
            return { name, price: this.parsePrice(price) };
        });

        const selectedDiagnoses = Array.from(document.querySelectorAll('input[name="diy_diagnosis"]:checked')).map(input => {
            const [name, price] = input.value.split('|');
            return { name, price: this.parsePrice(price) };
        });

        const selectedAddons = Array.from(document.querySelectorAll('input[name="addons"]:checked')).map(input => {
            const [name, price] = input.value.split('|');
            return { name, price: this.parsePrice(price) };
        });

        // 更新购物车详情
        this.cartDetails = {
            questions: selectedQuestions,
            diagnoses: selectedDiagnoses,
            package: selectedPackages,
            addons: selectedAddons,
            discount: this.cartDetails.discount || 0
        };

        // 计算总价
        this.calculateTotal();
        
        // 更新购物车摘要
        this.updateCartSummary();
        
        // 保存到本地存储
        this.saveCartToLocalStorage();
    }

    parsePrice(price) {
        if (!price) return 0;
        // 如果price已经是数字，直接返回
        if (typeof price === 'number') return price;
        // 如果是字符串，移除所有非数字字符（保留小数点）
        if (typeof price === 'string') {
            const cleanPrice = price.replace(/[^\d.]/g, '');
            const parsedPrice = parseFloat(cleanPrice);
            return isNaN(parsedPrice) ? 0 : parsedPrice;
        }
        // 其他情况返回0
        return 0;
    }

    formatPrice(price) {
        return `¥${this.parsePrice(price).toFixed(2)}`;
    }

    calculateTotal() {
        let total = 0;
        
        // 计算套餐总价
        this.cartDetails.package.forEach(pkg => {
            total += this.parsePrice(pkg.price);
        });
        
        // 计算DIY答疑总价
        this.cartDetails.questions.forEach(question => {
            total += this.parsePrice(question.price);
        });
        
        // 计算DIY诊断总价
        this.cartDetails.diagnoses.forEach(diagnosis => {
            total += this.parsePrice(diagnosis.price);
        });
        
        // 计算增值选项总价
        this.cartDetails.addons.forEach(addon => {
            total += this.parsePrice(addon.price);
        });
        
        // 应用折扣
        const discount = this.parsePrice(this.cartDetails.discount);
        total = Math.max(0, total - discount);
        
        // 更新总价显示
        const totalElement = document.getElementById('totalPrice');
        if (totalElement) {
            totalElement.textContent = this.formatPrice(total);
        }
        
        return total;
    }

    updateCartSummary() {
        const summaryElement = document.getElementById('cartSummary');
        if (!summaryElement) return;
        
        let summary = '<div class="cart-items">';
        
        // 添加套餐信息
        if (this.cartDetails.package.length > 0) {
            summary += '<div class="cart-section"><h3>基础套餐</h3><ul>';
            this.cartDetails.package.forEach(pkg => {
                summary += `<li>${pkg.name}  ${this.formatPrice(pkg.price)}</li>`;
            });
            summary += '</ul></div>';
        }
        
        // 添加DIY答疑信息
        if (this.cartDetails.questions.length > 0) {
            summary += '<div class="cart-section"><h3>DIY答疑</h3><ul>';
            this.cartDetails.questions.forEach(question => {
                summary += `<li>${question.name}  ${this.formatPrice(question.price)}</li>`;
            });
            summary += '</ul></div>';
        }
        
        // 添加DIY诊断信息
        if (this.cartDetails.diagnoses.length > 0) {
            summary += '<div class="cart-section"><h3>DIY诊断</h3><ul>';
            this.cartDetails.diagnoses.forEach(diagnosis => {
                summary += `<li>${diagnosis.name}  ${this.formatPrice(diagnosis.price)}</li>`;
            });
            summary += '</ul></div>';
        }
        
        // 添加增值选项信息
        if (this.cartDetails.addons.length > 0) {
            summary += '<div class="cart-section"><h3>增值选项</h3><ul>';
            this.cartDetails.addons.forEach(addon => {
                summary += `<li>${addon.name}  ${this.formatPrice(addon.price)}</li>`;
            });
            summary += '</ul></div>';
        }
        
        // 添加折扣信息
        if (this.cartDetails.discount > 0) {
            summary += `<div class="cart-section"><h3>折扣</h3><p>优惠金额: -${this.formatPrice(this.cartDetails.discount)}</p></div>`;
        }
        
        // 添加总价信息 - 使用更明显的格式
        const total = this.calculateTotal();
        summary += `<div class="cart-total"><h3>总计</h3><p class="total-price">${this.formatPrice(total)}</p></div>`;
        
        summary += '</div>';
        summaryElement.innerHTML = summary;
    }

    renderDetails() {
        // 直接调用 updateCartSummary 来渲染报价单
        this.updateCartSummary();
        
        // 返回报价单内容，用于导出图片
        const cartSummary = document.getElementById("cartSummary");
        return cartSummary ? cartSummary.innerHTML : "";
    }

    exportAsImage() {
        this.renderDetails();
        setTimeout(() => {
            const targetElement = document.querySelector(".cart-summary");
            if (!targetElement) return;

            html2canvas(targetElement, { scale: 2, useCORS: true }).then(quoteCanvas => {
                const imgData = quoteCanvas.toDataURL("image/png");
                const width = quoteCanvas.width;
                const height = quoteCanvas.height;

                // 创建 DOM canvas 元素
                const domCanvas = document.createElement("canvas");
                domCanvas.width = width;
                domCanvas.height = height;
                document.body.appendChild(domCanvas);

                const canvas = new fabric.Canvas(domCanvas, {
                    width: width,
                    height: height,
                    backgroundColor: "white"
                });

                fabric.Image.fromURL(imgData, function (img) {
                    canvas.add(img);
                    canvas.sendToBack(img);

                    // 添加水印
                    const today = new Date();
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const watermarkText = `${this.userName} | ${dateStr}`;
                    
                    // 增加水印间距
                    const stepX = 400; // 水平间距
                    const stepY = 240; // 垂直间距
                    
                    for (let y = 0; y < height * 2; y += stepY) {
                        for (let x = 0; x < width * 2; x += stepX) {
                            const watermark = new fabric.Text(watermarkText, {
                                fontSize: 24,
                                fill: 'rgba(0, 0, 0, 0.06)',
                                angle: -30,
                                left: x,
                                top: y,
                                originX: 'left',
                                originY: 'top',
                                selectable: false
                            });
                            canvas.add(watermark);
                        }
                    }

                    canvas.renderAll();

                    const link = document.createElement("a");
                    link.download = "MDPI服务报价图.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();

                    // 清理 DOM canvas
                    canvas.dispose();
                    domCanvas.remove();
                }.bind(this), { crossOrigin: 'anonymous' });
            }).catch(error => {
                console.error("Error capturing the image:", error);
            });
        }, 100);
    }

    // 本地存储功能
    saveCartToLocalStorage() {
        try {
            localStorage.setItem('cartDetails', JSON.stringify(this.cartDetails));
        } catch (e) {
            console.error('无法保存购物车数据到本地存储:', e);
        }
    }

    loadCartFromLocalStorage() {
        try {
            const savedCart = localStorage.getItem('cartDetails');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                
                // 恢复套餐选择
                if (parsedCart.package && parsedCart.package.length > 0) {
                    const packageInputs = document.querySelectorAll("input[name='package']");
                    packageInputs.forEach(input => {
                        const [name, price] = input.value.split("|");
                        if (parsedCart.package.some(pkg => pkg.name === name)) {
                            input.checked = true;
                        }
                    });
                }
                
                // 恢复DIY问题选择
                if (parsedCart.questions && parsedCart.questions.length > 0) {
                    const questionInputs = document.querySelectorAll("input[name='diy_question']");
                    questionInputs.forEach(input => {
                        const [name, price] = input.value.split("|");
                        if (parsedCart.questions.some(q => q.name === name)) {
                            input.checked = true;
                        }
                    });
                }
                
                // 恢复DIY诊断选择
                if (parsedCart.diagnoses && parsedCart.diagnoses.length > 0) {
                    const diagnosisInputs = document.querySelectorAll("input[name='diy_diagnosis']");
                    diagnosisInputs.forEach(input => {
                        const [name, price] = input.value.split("|");
                        if (parsedCart.diagnoses.some(d => d.name === name)) {
                            input.checked = true;
                        }
                    });
                }
                
                // 恢复增值服务选择
                if (parsedCart.addons && parsedCart.addons.length > 0) {
                    const addonInputs = document.querySelectorAll("input[name='addons']");
                    addonInputs.forEach(input => {
                        const [name, price] = input.value.split("|");
                        if (parsedCart.addons.some(a => a.name === name)) {
                            input.checked = true;
                        }
                    });
                }

                // 不恢复折扣金额，保持为0
                this.cartDetails.discount = 0;
                
                // 更新购物车摘要和总价
                this.updateCart();
            }
        } catch (e) {
            console.error('无法从本地存储加载购物车数据:', e);
        }
    }

    clearCart() {
        // 取消所有选择
        document.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });
        
        // 重置折扣输入
        const discountInput = document.getElementById('discountInput');
        if (discountInput) {
            discountInput.value = '0';
        }
        
        // 保持权限状态
        const currentPermission = this.permissionLevel;
        const currentMaxDiscount = this.maxDiscount;
        
        // 重置购物车数据
        this.cartDetails = {
            questions: [],
            diagnoses: [],
            package: [],
            addons: [],
            discount: 0
        };
        
        // 恢复权限状态
        this.permissionLevel = currentPermission;
        this.maxDiscount = currentMaxDiscount;
        
        // 清空本地存储
        localStorage.removeItem('cartDetails');
        
        // 更新购物车摘要和总价
        this.updateCart();
    }

    showSection(sectionId) {
        console.log('Switching to section:', sectionId);
        
        // 获取所有部分和导航链接
        const sections = document.querySelectorAll('.section');
        const activeLink = document.querySelector(`nav a[data-section="${sectionId}"]`);
        
        if (!sectionId || !activeLink) {
            console.error('Invalid section ID or active link not found');
            return;
        }
        
        // 隐藏所有部分
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // 显示目标部分
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }
        
        // 更新导航状态
        this.updateNavigationState(activeLink);
    }

    updateNavigationState(activeLink) {
        // 移除所有导航链接的活动状态
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // 为当前活动的导航链接添加活动状态
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            console.error('Active link not found for section:', sectionId);
        }
    }

    // 创建水印
    createWatermark() {
        if (!this.userName) return;
        
        const watermark = document.getElementById('watermark');
        const watermarkContent = document.getElementById('watermarkContent');
        
        if (!watermark || !watermarkContent) return;
        
        // 清空现有水印
        watermarkContent.innerHTML = '';
        
        // 获取当前日期
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // 创建水印文本
        const watermarkText = `${this.userName} | ${dateStr}`;
        
        // 计算需要的水印数量 - 使用更大的间距使水印更稀疏
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const watermarkWidth = 300; // 增加水印宽度
        const watermarkHeight = 100; // 增加水印高度
        
        const cols = Math.ceil(screenWidth / watermarkWidth) + 1;
        const rows = Math.ceil(screenHeight / watermarkHeight) + 1;
        
        // 创建水印元素 - 减少水印数量
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // 随机跳过一些位置，使水印更稀疏
                if (Math.random() > 0.3) continue;
                
                const watermarkItem = document.createElement('div');
                watermarkItem.className = 'watermark-item';
                watermarkItem.textContent = watermarkText;
                watermarkContent.appendChild(watermarkItem);
            }
        }
        
        // 显示水印
        watermark.style.display = 'block';
    }

    // 处理用户名提交
    submitUserName() {
        const userNameInput = document.getElementById('userName');
        const userName = userNameInput.value.trim();
        
        if (!userName) {
            alert('请输入您的姓名');
            return;
        }
        
        // 保存用户名
        this.userName = userName;
        
        // 创建水印
        this.createWatermark();
        
        // 隐藏欢迎模态框
        const welcomeModal = document.getElementById('welcomeModal');
        welcomeModal.style.display = 'none';
        
        // 显示首页
        this.showSection('home');
    }
}

// Initialize the cart manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // 初始化购物车管理器
    window.cartManager = new CartManager();
    
    // 显示欢迎模态框
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        welcomeModal.style.display = 'flex';
    }
    
    // 添加导航链接点击事件
    document.querySelectorAll('nav a').forEach(link => {
        const sectionId = link.getAttribute('data-section');
        if (sectionId) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.cartManager.showSection(sectionId);
            });
        }
    });
});

// 添加全局函数用于检查权限
function checkPermission() {
    window.cartManager.checkPermission();
} 