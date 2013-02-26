#!/usr/bin/env ruby
#coding: utf-8
class AcronymGenerator
  def initialize
    @initials = {}
    open('py.txt').each_line{|l|
      fields = l.strip.split(/ |\|/)
      ch, pys = fields[0],fields[1..-1]
      @initials[ch] = pys.map{|py|py[0]}.uniq
    }

  end

  def combine(arr, idx)
    if idx == arr.size - 1
      arr[idx]
    elsif arr[idx]
      suc = combine(arr, idx + 1)
      arr[idx].map{|el_me|suc.map{|el_suc| el_me + el_suc}}.flatten
    end
  end

  def generate chinese
    clean = chinese.strip.sub(/《.+?》/u,'')
    return chinese + 'WMS' if clean == '無名氏'
    chinese + combine(clean.chars.map{|ch|
      unless init = @initials[ch]
        puts chinese
        raise
      end
      init
    },0).join
  end


end
