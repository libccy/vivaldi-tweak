'use strict';
requestIdleCallback(() => {
    const toolbar = document.querySelector('#main>.toolbar');
    const webview = document.querySelector('#webview-container');
    const tabs = document.querySelector('#tabs-container .tab-strip');
    const tabsSwitch = document.querySelector('#switch>button.tabs');

    if(toolbar && webview && tabs && tabsSwitch){
        toolbar.classList.add('vt-shown');

        const input = toolbar.querySelector('.addressfield input');
        input.addEventListener('focus', () => {
            clearTimeout(toolbar.vt_hide_timeout);
            delete toolbar.vt_hide_timeout;
            toolbar.classList.add('vt-shown');
        });
        input.addEventListener('blur', () => {
            if(!toolbar.vt_hide_timeout){
                toolbar.vt_hide_timeout = setTimeout(() => {
                    toolbar.classList.remove('vt-shown');
                    delete toolbar.vt_hide_timeout;
                }, 200);
            }
        });
        toolbar.addEventListener('mousedown', () => {
            clearTimeout(toolbar.vt_hide_timeout);
            toolbar.vt_hide_timeout = setTimeout(() => {
                delete toolbar.vt_hide_timeout;
            }, 200);
        });

        const toggle = document.createElement('div');
        toggle.id = 'vt-toolbar-toggle';
        toggle.addEventListener('mouseenter', () => {
            input.focus();
        });
        webview.appendChild(toggle);

        const reload = toolbar.querySelector('.button-toolbar.reload');
        const reloadObserver = new MutationObserver(mutationsList => {
            for(var mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    if(reload.classList.contains('loading')){
                        toolbar.classList.add('vt-shown2');
                    }
                    else{
                        toolbar.classList.remove('vt-shown2');
                    }
                }
            }
        });
        reloadObserver.observe(reload, { attributes: true });

        const hookBookmark = () => {
            const bookmark = toolbar.querySelector('.add-bookmark-container');
            if(bookmark){
                const bookmarkObserver = new MutationObserver(mutationsList => {
                    for(var mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            if(bookmark.querySelector('.dialog-add-bookmark')){
                                toolbar.classList.add('vt-shown3');
                            }
                            else{
                                toolbar.classList.remove('vt-shown3');
                            }
                        }
                    }
                });
                bookmarkObserver.observe(bookmark, { childList: true });
                return true;
            }
            else{
                return false;
            }
        };
        if(!hookBookmark()){
            const addressfield = toolbar.querySelector('.addressfield');
            const addressfieldObserver = new MutationObserver(() => {
                if(hookBookmark()){
                    addressfieldObserver.disconnect();
                }
            });
            addressfieldObserver.observe(addressfield, {childList: true});
        }

        let tabStrip = null;
        const insertTabStrip = () => {
            let panel = document.querySelector('#window-panel');
            if(panel){
                const section = panel.querySelector('section');
                if(!tabStrip){
                    const chrome = window.chrome;
                    tabStrip = document.createElement('div');
                    tabStrip.className = 'vt-tab-strip';
                    tabStrip.innerHTML = '<style>::-webkit-scrollbar{display:none}</style>';

                    const createTab = tab => {
                        const node = document.createElement('div');
                        node.tabId = tab.id;
                        node.addEventListener('mousedown', () => {
                            chrome.tabs.update(tab.id, {active: true});
                        });
                        if(tab.active){
                            node.classList.add('active');
                        }

                        const thumbnail = document.createElement('div');
                        thumbnail.className = 'thumbnail';
                        node.appendChild(thumbnail);

                        const getThumb = () => {
                            const thumblink = document.querySelector('#tabs-container #tab-' + tab.id + '>.thumbnail-image');
                            if(thumblink){
                                node.thumblink = thumblink;
                                thumbnail.style.backgroundImage = thumblink.style.backgroundImage;
                                node.observer = new MutationObserver(() => {
                                    thumbnail.style.backgroundImage = thumblink.style.backgroundImage;
                                });
                                node.observer.observe(thumblink, {attributes: true});
                                return true;
                            }
                            else{
                                return false;
                            }
                        };
                        if(!getThumb()){
                            setTimeout(() => {
                                if(!getThumb()){
                                    setTimeout(() => {
                                        setTimeout(getThumb, 500);
                                    }, 200);
                                }
                            }, 100);
                        }


                        const close = document.createElement('div');
                        close.className = 'close';
                        close.innerHTML =
                            `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                              <path d="M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5 6l3.1 3.1-3 2.9 1.5 1.4L9 10.5l2.9 2.9 1.5-1.4-3-2.9"></path>
                            </svg>`;
                        node.appendChild(close);
                        close.addEventListener('click', () => {
                            chrome.tabs.remove(tab.id);
                        });

                        tabStrip.appendChild(node);
                    };

                    chrome.windows.getCurrent(e => {
                        tabStrip.windowId = e.id;
                        chrome.tabs.getAllInWindow(e.id, tabs => {
                            for(let tab of tabs){
                                createTab(tab);
                            }
                        });
                    });
                    chrome.tabs.onActivated.addListener(e => {
                        if(e.windowId === tabStrip.windowId){
                            for(let node of tabStrip.childNodes){
                                if(node.tabId === e.tabId){
                                    node.classList.add('active');
                                }
                                else{
                                    node.classList.remove('active');
                                }
                            }
                        }
                    });
                    chrome.tabs.onCreated.addListener(tab => {
                        if(tab.windowId === tabStrip.windowId){
                            createTab(tab);
                        }
                    });
                    chrome.tabs.onRemoved.addListener(id => {
                        for(let node of tabStrip.childNodes){
                            if(node.tabId === id){
                                node.remove();
                                if(node.observer){
                                    node.observer.disconnect();
                                }
                            }
                        }
                    });

                    // chrome.tabs.onUpdated.addListener(id => {
                    //     for(let node of tabStrip.childNodes){
                    //         if(node.tabId === id && node.thumblink){
                    //             node.firstChild.style.backgroundImage = node.thumblink.style.backgroundImage;
                    //         }
                    //     }
                    // });
                }

                const selector = section.firstChild.cloneNode(true);
                selector.lastChild.remove();
                selector.firstChild.title = 'Tabs';
                selector.firstChild.innerHTML =
                    `<option value = "default">Tabs</option>
                    <option value = "settings">Settings</option>
                    `
                section.insertBefore(selector, section.firstChild);
                section.insertBefore(tabStrip, section.childNodes[1]);
            }
        }
        insertTabStrip();
        const switchObserver = new MutationObserver(() => {
            insertTabStrip();
        });
        switchObserver.observe(tabsSwitch, { attributes: true });
    }
});
