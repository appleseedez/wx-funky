var React = require('react');
var PropTypes = React.PropTypes;
var Router = require('react-router-ie8');
var Api = require('../config/api.js');
var SKMap = require('../config/wx-skmap.js');
var ImageListItem = require('./image-item.js');
var WXHeaderMenu = require('./wx-header-menu.js');

var WXWeddingCarRental = React.createClass({
    mixins:[Router.State], //我们需要知道当前的path params 等等信息
    //初始化状态。
    // 分页，资源标示，数据，根路由，总条数， 风格类型
    getInitialState: function() {
        var self = this;

        return {
            params:{
                pageSize:6,
                pageIndex:1
            },
            tplKey:'list#car',
            payload:[],
            sliderData:[],
            baseUrl:'',
            totalCount:0,
            brands:[],
            models:[],
            levels:[]
        };
    },

    //取数据
    fetchData:function(url,params){
        return Api.httpGET(url,params);
    },

    componentDidMount: function() {
        var self = this;
        var $menu_classify = $('.menu-classify');

        $('span',$menu_classify).eq(0).addClass('item-current');
        $menu_classify.on('click','span',function(){
            var ind = $(this).index();

            $(this).addClass('item-current');
            $(this).siblings().removeClass('item-current');
            $('ul',$menu_classify).eq(ind - 1).css({display:'block'})
                .siblings().removeAttr('style');

            if(ind <= 0){
                $('ul',$menu_classify).removeAttr('style');
            }
        });

        $menu_classify.on('click','li',function(){
            $(this).parent().removeAttr('style');
            $('li',$menu_classify).removeAttr('class');
            $(this).addClass('li-current');
        });

        var parseResource = function(){
            var resourceLinks = window.Core.resource[SKMap['#'+self.getPath()]];

            $.each(resourceLinks,function(k,v){
                resourceLinks = v;
            });

            self.fetchData(resourceLinks.split('#')[1],self.state.params)
                .done(function(payload){
                    (payload && payload.data.length>0 && payload.code === 200) &&
                    self.setState({
                        payload:payload.data,
                        baseUrl:resourceLinks.split('#')[1],
                        totalCount:parseInt(payload.totalCount)
                    });
                    //console.log(payload.data);
                    //绑上滚动加载。
                    self.scrollPos($("#scroll_box"),$("#scroll_content"),self.state.params);

                })
        }

        var brands = function(){
            self.fetchData('car/brands')
                .done(function(payload){
                    self.setState({
                        brands:payload.data
                    });
                });
        }
        var models = function(){
            self.fetchData('car/models')
                .done(function(payload){
                    self.setState({
                        models:payload.data
                    });
                });
        }
        var levels = function(){
            self.fetchData('car/levels')
                .done(function(payload){
                    self.setState({
                        levels:payload.data
                    });
                });
        }

        $.when(window.Core.promises['/'])
            .then(brands)
            .then(models)
            .then(levels)
            .then(parseResource);
    },

    clickFunc : function(obj){
        var self = this;

        $("#scroll_box").unbind('scroll');
        self.state.params.pageIndex = 1;
        $.extend(obj,self.state.params);

        self.fetchData(self.state.baseUrl,obj)
            .done(function(payload){
                (payload.data && payload.code===200)&&
                self.setState({
                    payload:payload.data,
                    totalCount:payload.totalCount
                })
                //console.log(payload.data);

                $("#scroll_box").unbind('scroll');
                self.scrollPos($("#scroll_box"),$("#scroll_content"),obj);
            })
    },

    scrollPos:function(box,cont,params){
        var self = this;

        params.pageIndex ++;
        box.bind("scroll",function(){
            if(box.scrollTop() + box.height() >= cont.height() && !window.Core.isFeching){
                self.scrollFunc(self.state.baseUrl,params);
                params.pageIndex ++;
            }
        });
    },

    scrollFunc:function(url,params) {
        var self = this;

        if(parseInt(self.state.totalCount)>0 &&
            parseInt(params.pageSize)*parseInt(params.pageIndex - 1) >parseInt(self.state.totalCount))
            return;
        $('#loaderIndicator').addClass('isShow');
        window.Core.isFeching = true;
        var timeout = window.setTimeout(function(){
            window.Core.isFeching = false;
        },5000);
        self.fetchData(url,params)
            .done(function(payload){
                (payload.data && payload.code === 200) &&
                self.setState({
                    payload:((params.pageIndex === 1)?payload.data : self.state.payload.concat(payload.data)),
                    pageIndex:parseInt(self.state.pageIndex)+1
                });
                window.Core.isFeching = false;
                window.clearTimeout(timeout);
                $('#loaderIndicator').removeClass('isShow');
            })
    },

    render: function(){
        var self = this;
        var pageData = self.state.payload;
        var baseUrl = self.state.baseUrl;
        var brands = self.state.brands;
        var models = self.state.models;
        var levels = self.state.levels;

        return (
            <div className="supplies-list-view mobile-main-box">
                <WXHeaderMenu menuType={'menu_8'} name={0} />

                <div className='supplies-list' id='scroll_box'>
                    <div id='scroll_content' className='scroll-countent'>
                        <div className='content-first-box'>
                            <div className='menu-classify menu-classify-car clearfix'>
                                <span onClick={self.clickFunc.bind(self,{})}>全部</span>
                                <span>品牌</span>
                                <span>型号</span>
                                {
                                //<span>档次</span>
                                }
                                <span>价格</span>
                                <span>类型</span>
                                <ul>
                                    {
                                        $.map(brands,function(v,i){
                                            return(
                                                <li key={i} onClick={self.clickFunc.bind(self,{carBrandId:v.id})}><b>{v.name}</b></li>
                                            )
                                        })
                                    }
                                </ul>
                                <ul>
                                    {
                                        $.map(models,function(v,i){
                                            return(
                                                <li key={i} onClick={self.clickFunc.bind(self,{carModelsId:v.id})}><b>{v.name}</b></li>
                                            )
                                        })
                                    }
                                </ul>
                                {
                                    //<ul>
                                    //    {
                                    //        $.map(levels, function (v, i) {
                                    //            return (
                                    //                <li key={i} onClick={self.clickFunc.bind(self,{carLevelId:v.id})}>
                                    //                    <b>{v.name}</b></li>
                                    //            )
                                    //        })
                                    //    }
                                    //</ul>
                                }
                                <ul>
                                    <li onClick={self.clickFunc.bind(self,{})}><b>全部价格</b></li>
                                    <li onClick={self.clickFunc.bind(self,{priceEnd:999})}><b>1000元以下</b></li>
                                    <li onClick={self.clickFunc.bind(self,{priceStart:1000,priceEnd:2000})}><b>1000-2000元</b></li>
                                    <li onClick={self.clickFunc.bind(self,{priceStart:2000,priceEnd:3000})}><b>2000-3000元</b></li>
                                    <li onClick={self.clickFunc.bind(self,{priceStart:3001})}><b>3000元以上</b></li>
                                </ul>
                                <ul>
                                    <li onClick={self.clickFunc.bind(self,{carNature:1})}><b>单车</b></li>
                                    <li onClick={self.clickFunc.bind(self,{carNature:2})}><b>车队</b></li>
                                </ul>
                            </div>
                            <ul className="list-7-wxjs clearfix">
                                {
                                    $.map(pageData,function(v,i){
                                        return(
                                            <li key={i}>
                                                <a className='hover-box' href={'#/' + baseUrl + '/' + v.weddingCarRentalId}>
                                                    <img src={v.coverUrl} />
                                                    <h1>{v.title}</h1>
                                                    <div className='price-box'>
                                                        <b><em>￥</em><b>{v.rentalPrice.toFixed(2)}</b></b>
                                                        <span>{v.marketRentalPrice && '￥' + v.marketRentalPrice.toFixed(2)}</span>
                                                    </div>
                                                </a>
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                        </div>
                    </div>
                    <div id="loaderIndicator" className="btn-more"><span id="loading-info">正在加载... ...</span></div>
                </div>
            </div>
        );
    }
});

module.exports = WXWeddingCarRental;
